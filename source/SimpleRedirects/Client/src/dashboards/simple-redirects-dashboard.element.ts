import { LitElement, html, css, nothing, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import type { Redirect } from '../models/redirect.js';
import {
  getAllRedirects,
  addRedirect,
  updateRedirect,
  deleteRedirect,
  deleteAllRedirects,
  clearCache,
  exportRedirects,
  importRedirects,
} from '../api/simple-redirects.api.js';

@customElement('simple-redirects-dashboard')
export default class SimpleRedirectsDashboardElement extends UmbElementMixin(LitElement) {
  @state() private _redirects: Redirect[] = [];
  @state() private _filteredRedirects: Redirect[] = [];
  @state() private _searchTerm = '';
  @state() private _loading = true;
  @state() private _errorMessage = '';
  @state() private _cacheCleared = false;
  @state() private _sortField: keyof Redirect = 'lastUpdated';
  @state() private _sortDirection: 'asc' | 'desc' = 'desc';
  @state() private _currentPage = 1;
  @state() private _pageSize = 10;

  // Add/edit form state
  @state() private _editingId: number | null = null;
  @state() private _formIsRegex = false;
  @state() private _formOldUrl = '';
  @state() private _formNewUrl = '';
  @state() private _formRedirectCode = 301;
  @state() private _formNotes = '';

  // Import dialog state
  @state() private _showImportDialog = false;
  @state() private _importFile: File | null = null;
  @state() private _importOverwrite = false;
  @state() private _importMessage = '';
  @state() private _importErrors: Array<{ entry: number; message: string; oldUrl: string; newUrl: string; redirectCode: number }> = [];

  connectedCallback() {
    super.connectedCallback();
    this._fetchRedirects();
  }

  private async _fetchRedirects() {
    this._loading = true;
    try {
      this._redirects = await getAllRedirects(this);
      this._applyFilterAndSort();
    } catch {
      this._errorMessage = 'Error fetching redirects from server';
    }
    this._loading = false;
  }

  private _applyFilterAndSort() {
    let data = [...this._redirects];

    if (this._searchTerm) {
      const term = this._searchTerm.toLowerCase();
      data = data.filter(
        (r) =>
          (r.notes || '').toLowerCase().includes(term) ||
          r.oldUrl.toLowerCase().includes(term) ||
          r.newUrl.toLowerCase().includes(term)
      );
    }

    data.sort((a, b) => {
      const aVal = a[this._sortField] ?? '';
      const bVal = b[this._sortField] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return this._sortDirection === 'asc' ? cmp : -cmp;
    });

    this._filteredRedirects = data;
  }

  private get _pagedRedirects() {
    const start = (this._currentPage - 1) * this._pageSize;
    return this._filteredRedirects.slice(start, start + this._pageSize);
  }

  private get _totalPages() {
    return Math.max(1, Math.ceil(this._filteredRedirects.length / this._pageSize));
  }

  private _onSearchInput(e: Event) {
    this._searchTerm = (e.target as HTMLInputElement).value;
    this._currentPage = 1;
    this._applyFilterAndSort();
  }

  private _sort(field: keyof Redirect) {
    if (this._sortField === field) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortField = field;
      this._sortDirection = 'asc';
    }
    this._applyFilterAndSort();
  }

  private _startEdit(redirect: Redirect) {
    this._editingId = redirect.id;
    this._formIsRegex = redirect.isRegex;
    this._formOldUrl = redirect.oldUrl;
    this._formNewUrl = redirect.newUrl;
    this._formRedirectCode = redirect.redirectCode;
    this._formNotes = redirect.notes;
  }

  private _cancelEdit() {
    this._editingId = null;
    this._clearForm();
  }

  private _clearForm() {
    this._formIsRegex = false;
    this._formOldUrl = '';
    this._formNewUrl = '';
    this._formRedirectCode = 301;
    this._formNotes = '';
  }

  private async _handleAdd() {
    this._errorMessage = '';
    const response = await addRedirect(this, {
      isRegex: this._formIsRegex,
      oldUrl: this._formOldUrl,
      newUrl: this._formNewUrl,
      redirectCode: this._formRedirectCode,
      notes: this._formNotes,
    });

    if (response.success) {
      this._redirects = [...this._redirects, response.newRedirect];
      this._applyFilterAndSort();
      this._clearForm();
    } else {
      this._errorMessage = response.message;
    }
  }

  private async _handleUpdate() {
    if (this._editingId === null) return;
    this._errorMessage = '';

    const redirect: Redirect = {
      id: this._editingId,
      isRegex: this._formIsRegex,
      oldUrl: this._formOldUrl,
      newUrl: this._formNewUrl,
      redirectCode: this._formRedirectCode,
      notes: this._formNotes,
      lastUpdated: null,
    };

    const response = await updateRedirect(this, redirect);
    if (response.success) {
      const idx = this._redirects.findIndex((r) => r.id === this._editingId);
      if (idx > -1) {
        this._redirects[idx] = response.updatedRedirect;
        this._redirects = [...this._redirects];
      }
      this._editingId = null;
      this._clearForm();
      this._applyFilterAndSort();
    } else {
      this._errorMessage = response.message;
    }
  }

  private async _handleDelete(redirect: Redirect) {
    if (!confirm('Are you sure you want to delete this redirect?')) return;
    this._errorMessage = '';

    const response = await deleteRedirect(this, redirect.id);
    if (response.success) {
      this._redirects = this._redirects.filter((r) => r.id !== redirect.id);
      this._applyFilterAndSort();
    } else {
      this._errorMessage = response.message;
    }
  }

  private async _handleDeleteAll() {
    if (!confirm('Are you sure you want to delete all redirects?')) return;
    this._errorMessage = '';

    const response = await deleteAllRedirects(this);
    if (response.success) {
      this._redirects = [];
      this._applyFilterAndSort();
    } else {
      this._errorMessage = response.message;
    }
  }

  private async _handleClearCache() {
    await clearCache(this);
    this._cacheCleared = true;
    await this._fetchRedirects();
    setTimeout(() => {
      this._cacheCleared = false;
    }, 3000);
  }

  private async _handleExport(provider: 'Csv' | 'Excel') {
    await exportRedirects(this, provider);
  }

  private _openImportDialog() {
    this._showImportDialog = true;
    this._importFile = null;
    this._importOverwrite = false;
    this._importMessage = '';
    this._importErrors = [];
  }

  private _closeImportDialog() {
    this._showImportDialog = false;
    this._fetchRedirects();
  }

  private _onImportFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this._importFile = input.files?.[0] ?? null;
  }

  private async _handleImport() {
    if (!this._importFile) return;

    const response = await importRedirects(this, this._importFile, this._importOverwrite);
    this._importMessage = response.message;

    if (response.errorRedirects?.length > 0) {
      this._importErrors = response.errorRedirects.map((err, i) => ({
        entry: i + 1,
        message: err.notes,
        oldUrl: err.oldUrl,
        newUrl: err.newUrl,
        redirectCode: err.redirectCode,
      }));
    } else {
      this._importErrors = [];
    }
  }

  private _formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private _sortIndicator(field: keyof Redirect) {
    if (this._sortField !== field) return '';
    return this._sortDirection === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  static styles = css`
    :host {
      display: block;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 10px;
      flex-wrap: wrap;
    }

    .count {
      color: var(--uui-color-text-alt);
      font-size: 14px;
    }

    .error-bar {
      background: var(--uui-color-danger);
      color: white;
      padding: 10px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .error-bar button {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
    }

    .cache-cleared {
      color: var(--uui-color-positive);
      font-size: 13px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--uui-color-surface);
      border-radius: 6px;
      overflow: hidden;
    }

    th {
      text-align: left;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--uui-color-text-alt);
      border-bottom: 2px solid var(--uui-color-border);
      cursor: pointer;
      user-select: none;
    }

    th:hover {
      color: var(--uui-color-interactive-emphasis);
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--uui-color-border);
      vertical-align: middle;
      font-size: 14px;
    }

    td a {
      color: var(--uui-color-interactive);
      text-decoration: none;
    }

    td a:hover {
      text-decoration: underline;
    }

    .actions {
      display: flex;
      gap: 6px;
    }

    .add-form {
      display: contents;
    }

    .add-form td {
      background: var(--uui-color-surface-alt);
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
    }

    .page-size {
      display: flex;
      gap: 4px;
    }

    /* Import dialog overlay */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog {
      background: var(--uui-color-surface);
      border-radius: 8px;
      padding: 24px;
      min-width: 500px;
      max-width: 700px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .dialog h2 {
      margin-top: 0;
    }

    .dialog-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      align-items: center;
    }

    .import-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
    }

    .import-message {
      margin-top: 12px;
      padding: 8px;
      border-radius: 4px;
      background: var(--uui-color-surface-alt);
    }

    .error-table {
      width: 100%;
      margin-top: 12px;
      font-size: 13px;
    }

    .error-table th,
    .error-table td {
      padding: 6px 8px;
    }

    uui-input {
      width: 100%;
    }
  `;

  render() {
    return html`
      <div class="header">
        <div>
          <h1>Simple Redirects Manager</h1>
          <p style="color: var(--uui-color-text-alt); margin: 4px 0 0;">
            Add, update, and delete redirects in the table below.
          </p>
        </div>
        <div class="header-actions">
          <uui-button
            label="Import"
            look="secondary"
            @click=${this._openImportDialog}
          ></uui-button>
          <uui-button
            label="Export CSV"
            look="secondary"
            @click=${() => this._handleExport('Csv')}
          ></uui-button>
          <uui-button
            label="Export Excel"
            look="secondary"
            @click=${() => this._handleExport('Excel')}
          ></uui-button>
          <uui-button
            label="Clear Cache"
            look="secondary"
            @click=${this._handleClearCache}
          ></uui-button>
          ${this._cacheCleared ? html`<span class="cache-cleared">Cache Cleared!</span>` : nothing}
          <uui-button
            label="Delete All"
            look="primary"
            color="danger"
            @click=${this._handleDeleteAll}
          ></uui-button>
        </div>
      </div>

      ${this._errorMessage
        ? html`
            <div class="error-bar">
              <span>Error: ${this._errorMessage}</span>
              <button @click=${() => (this._errorMessage = '')}>&times;</button>
            </div>
          `
        : nothing}

      <div class="toolbar">
        <span class="count">${this._filteredRedirects.length} redirects</span>
        <uui-input
          placeholder="Search redirects..."
          .value=${this._searchTerm}
          @input=${this._onSearchInput}
        ></uui-input>
      </div>

      ${this._loading
        ? html`<uui-loader-bar></uui-loader-bar>`
        : html`
            <table>
              <thead>
                <tr>
                  <th @click=${() => this._sort('isRegex')}>Regex${this._sortIndicator('isRegex')}</th>
                  <th @click=${() => this._sort('oldUrl')}>Old URL${this._sortIndicator('oldUrl')}</th>
                  <th @click=${() => this._sort('newUrl')}>New URL${this._sortIndicator('newUrl')}</th>
                  <th @click=${() => this._sort('redirectCode')}>Type${this._sortIndicator('redirectCode')}</th>
                  <th @click=${() => this._sort('notes')}>Notes${this._sortIndicator('notes')}</th>
                  <th @click=${() => this._sort('lastUpdated')}>Last Updated${this._sortIndicator('lastUpdated')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this._pagedRedirects.map((r) =>
                  this._editingId === r.id ? this._renderEditRow(r) : this._renderRow(r)
                )}
                ${this._editingId === null ? this._renderAddRow() : nothing}
              </tbody>
            </table>

            <div class="pagination">
              <uui-button
                label="Previous"
                look="secondary"
                ?disabled=${this._currentPage <= 1}
                @click=${() => { this._currentPage--; }}
              ></uui-button>
              <span>Page ${this._currentPage} of ${this._totalPages}</span>
              <uui-button
                label="Next"
                look="secondary"
                ?disabled=${this._currentPage >= this._totalPages}
                @click=${() => { this._currentPage++; }}
              ></uui-button>
              <div class="page-size">
                ${[10, 25, 50, 100].map(
                  (size) => html`
                    <uui-button
                      label="${size}"
                      look=${this._pageSize === size ? 'primary' : 'secondary'}
                      compact
                      @click=${() => { this._pageSize = size; this._currentPage = 1; }}
                    ></uui-button>
                  `
                )}
              </div>
            </div>
          `}

      ${this._showImportDialog ? this._renderImportDialog() : nothing}
    `;
  }

  private _renderRow(r: Redirect) {
    return html`
      <tr>
        <td><uui-icon name=${r.isRegex ? 'icon-check' : 'icon-delete'}></uui-icon></td>
        <td>
          ${r.isRegex
            ? html`<span>${r.oldUrl || '/'}</span>`
            : html`<a href=${r.oldUrl || '/'} target="_blank">${r.oldUrl || '/'}</a>`}
        </td>
        <td><a href=${r.newUrl} target="_blank">${r.newUrl}</a></td>
        <td>${r.redirectCode === 301 ? 'Permanent' : 'Temporary'}</td>
        <td>${r.notes}</td>
        <td>${this._formatDate(r.lastUpdated)}</td>
        <td class="actions">
          <uui-button label="Edit" look="secondary" compact @click=${() => this._startEdit(r)}></uui-button>
          <uui-button label="Delete" look="secondary" color="danger" compact @click=${() => this._handleDelete(r)}></uui-button>
        </td>
      </tr>
    `;
  }

  private _renderEditRow(r: Redirect) {
    return html`
      <tr class="add-form">
        <td>
          <uui-toggle
            .checked=${this._formIsRegex}
            @change=${(e: Event) => (this._formIsRegex = (e.target as any).checked)}
          ></uui-toggle>
        </td>
        <td>
          <uui-input
            placeholder="Old URL"
            .value=${this._formOldUrl}
            @input=${(e: Event) => (this._formOldUrl = (e.target as HTMLInputElement).value)}
          ></uui-input>
        </td>
        <td>
          <uui-input
            placeholder="New URL"
            .value=${this._formNewUrl}
            @input=${(e: Event) => (this._formNewUrl = (e.target as HTMLInputElement).value)}
          ></uui-input>
        </td>
        <td>
          <uui-select
            .value=${String(this._formRedirectCode)}
            @change=${(e: Event) => (this._formRedirectCode = Number((e.target as any).value))}
            .options=${[
              { name: 'Permanent (301)', value: '301', selected: this._formRedirectCode === 301 },
              { name: 'Temporary (302)', value: '302', selected: this._formRedirectCode === 302 },
            ]}
          ></uui-select>
        </td>
        <td>
          <uui-input
            placeholder="Notes"
            .value=${this._formNotes}
            @input=${(e: Event) => (this._formNotes = (e.target as HTMLInputElement).value)}
          ></uui-input>
        </td>
        <td>&nbsp;</td>
        <td class="actions">
            <uui-button label="Save" look="primary" color="positive" compact @click=${this._handleUpdate}></uui-button>
            <uui-button label="Cancel" look="secondary" compact @click=${this._cancelEdit}></uui-button>
        </td>
      </tr>
    `;
  }

  private _renderAddRow() {
    return html`
      <tr class="add-form">
        <td>
          <uui-toggle
            .checked=${this._formIsRegex}
            @change=${(e: Event) => (this._formIsRegex = (e.target as any).checked)}
          ></uui-toggle>
        </td>
        <td>
          <uui-input
            placeholder="Old URL"
            .value=${this._formOldUrl}
            @input=${(e: Event) => (this._formOldUrl = (e.target as HTMLInputElement).value)}
          ></uui-input>
        </td>
        <td>
          <uui-input
            placeholder="New URL"
            .value=${this._formNewUrl}
            @input=${(e: Event) => (this._formNewUrl = (e.target as HTMLInputElement).value)}
          ></uui-input>
        </td>
        <td>
          <uui-select
            .value=${String(this._formRedirectCode)}
            @change=${(e: Event) => (this._formRedirectCode = Number((e.target as any).value))}
            .options=${[
              { name: 'Permanent (301)', value: '301', selected: this._formRedirectCode === 301 },
              { name: 'Temporary (302)', value: '302', selected: this._formRedirectCode === 302 },
            ]}
          ></uui-select>
        </td>
        <td>
          <uui-input
            placeholder="Notes"
            .value=${this._formNotes}
            @input=${(e: Event) => (this._formNotes = (e.target as HTMLInputElement).value)}
          ></uui-input>
        </td>
        <td>&nbsp;</td>
        <td>
            <uui-button label="Add" look="primary" compact @click=${this._handleAdd}></uui-button>
        </td>
      </tr>
    `;
  }

  private _renderImportDialog() {
    return html`
      <div class="dialog-overlay" @click=${(e: Event) => { if (e.target === e.currentTarget) this._closeImportDialog(); }}>
        <div class="dialog">
          <h2>Import Redirects</h2>
          <input
            type="file"
            accept=".csv,.xlsx"
            @change=${this._onImportFileChange}
          />

          ${this._importFile
            ? html`
                <div class="import-toggle">
                  <span>Overwrite existing redirects?</span>
                  <uui-toggle
                    .checked=${this._importOverwrite}
                    @change=${(e: Event) => (this._importOverwrite = (e.target as any).checked)}
                    label=${this._importOverwrite ? 'Overwrite' : "Don't overwrite"}
                  ></uui-toggle>
                </div>
              `
            : nothing}

          ${this._importMessage
            ? html`<div class="import-message">${this._importMessage}</div>`
            : nothing}

          ${this._importErrors.length > 0
            ? html`
                <table class="error-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Error</th>
                      <th>Old URL</th>
                      <th>New URL</th>
                      <th>Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this._importErrors.map(
                      (err) => html`
                        <tr>
                          <td>${err.entry}</td>
                          <td>${err.message}</td>
                          <td>${err.oldUrl}</td>
                          <td>${err.newUrl}</td>
                          <td>${err.redirectCode}</td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>
              `
            : nothing}

          <div class="dialog-actions">
            <uui-button
              label="Import"
              look="primary"
              ?disabled=${!this._importFile}
              @click=${this._handleImport}
            ></uui-button>
            <uui-button
              label="Close"
              look="secondary"
              @click=${this._closeImportDialog}
            ></uui-button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-redirects-dashboard': SimpleRedirectsDashboardElement;
  }
}
