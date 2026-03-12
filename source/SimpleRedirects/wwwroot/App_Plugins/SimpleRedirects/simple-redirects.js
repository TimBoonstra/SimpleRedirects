import { LitElement as f, nothing as h, html as l, css as b, state as s, customElement as w } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin as x } from "@umbraco-cms/backoffice/element-api";
import { UMB_AUTH_CONTEXT as m } from "@umbraco-cms/backoffice/auth";
const c = "/umbraco/management/api/v1/simple-redirects";
async function u(e) {
  const t = await e.getContext(m);
  return {
    Authorization: `Bearer ${await (t == null ? void 0 : t.getLatestToken())}`,
    "Content-Type": "application/json"
  };
}
async function $(e) {
  const t = await u(e);
  return (await fetch(`${c}/redirects`, { headers: t, credentials: "include" })).json();
}
async function y(e, t) {
  const r = await u(e);
  return (await fetch(`${c}/redirect`, {
    method: "POST",
    headers: r,
    credentials: "include",
    body: JSON.stringify(t)
  })).json();
}
async function v(e, t) {
  const r = await u(e);
  return (await fetch(`${c}/redirect`, {
    method: "PUT",
    headers: r,
    credentials: "include",
    body: JSON.stringify({ redirect: t })
  })).json();
}
async function R(e, t) {
  const r = await u(e);
  return (await fetch(`${c}/redirect/${t}`, {
    method: "DELETE",
    headers: r,
    credentials: "include"
  })).json();
}
async function U(e) {
  const t = await u(e);
  return (await fetch(`${c}/redirects`, {
    method: "DELETE",
    headers: t,
    credentials: "include"
  })).json();
}
async function k(e) {
  const t = await u(e);
  await fetch(`${c}/cache/clear`, {
    method: "POST",
    headers: t,
    credentials: "include"
  });
}
function C(e) {
  return `${c}/redirects/export?dataRecordProvider=${e}`;
}
async function I(e, t) {
  const r = await e.getContext(m), a = await (r == null ? void 0 : r.getLatestToken()), n = await fetch(C(t), {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${a}`,
      Accept: t === "Csv" ? "text/csv" : "application/vnd.ms-excel"
    }
  });
  if (!n.ok) return;
  const d = await n.blob();
  if (d.size === 0) return;
  const p = `SimpleRedirects-Export.${t === "Csv" ? "csv" : "xlsx"}`, g = window.URL.createObjectURL(d), _ = document.createElement("a");
  _.href = g, _.download = p, _.click(), setTimeout(() => window.URL.revokeObjectURL(g), 5e3);
}
async function E(e, t, r) {
  const a = await e.getContext(m), n = await (a == null ? void 0 : a.getLatestToken()), d = new FormData();
  return d.append("file", t), (await fetch(`${c}/redirects/import?overwriteMatches=${r}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${n}`
    },
    body: d
  })).json();
}
var D = Object.defineProperty, O = Object.getOwnPropertyDescriptor, o = (e, t, r, a) => {
  for (var n = a > 1 ? void 0 : a ? O(t, r) : t, d = e.length - 1, p; d >= 0; d--)
    (p = e[d]) && (n = (a ? p(t, r, n) : p(n)) || n);
  return a && n && D(t, r, n), n;
};
let i = class extends x(f) {
  constructor() {
    super(...arguments), this._redirects = [], this._filteredRedirects = [], this._searchTerm = "", this._loading = !0, this._errorMessage = "", this._cacheCleared = !1, this._sortField = "lastUpdated", this._sortDirection = "desc", this._currentPage = 1, this._pageSize = 10, this._editingId = null, this._formIsRegex = !1, this._formOldUrl = "", this._formNewUrl = "", this._formRedirectCode = 301, this._formNotes = "", this._showImportDialog = !1, this._importFile = null, this._importOverwrite = !1, this._importMessage = "", this._importErrors = [];
  }
  connectedCallback() {
    super.connectedCallback(), this._fetchRedirects();
  }
  async _fetchRedirects() {
    this._loading = !0;
    try {
      this._redirects = await $(this), this._applyFilterAndSort();
    } catch {
      this._errorMessage = "Error fetching redirects from server";
    }
    this._loading = !1;
  }
  _applyFilterAndSort() {
    let e = [...this._redirects];
    if (this._searchTerm) {
      const t = this._searchTerm.toLowerCase();
      e = e.filter(
        (r) => (r.notes || "").toLowerCase().includes(t) || r.oldUrl.toLowerCase().includes(t) || r.newUrl.toLowerCase().includes(t)
      );
    }
    e.sort((t, r) => {
      const a = t[this._sortField] ?? "", n = r[this._sortField] ?? "", d = String(a).localeCompare(String(n), void 0, { numeric: !0 });
      return this._sortDirection === "asc" ? d : -d;
    }), this._filteredRedirects = e;
  }
  get _pagedRedirects() {
    const e = (this._currentPage - 1) * this._pageSize;
    return this._filteredRedirects.slice(e, e + this._pageSize);
  }
  get _totalPages() {
    return Math.max(1, Math.ceil(this._filteredRedirects.length / this._pageSize));
  }
  _onSearchInput(e) {
    this._searchTerm = e.target.value, this._currentPage = 1, this._applyFilterAndSort();
  }
  _sort(e) {
    this._sortField === e ? this._sortDirection = this._sortDirection === "asc" ? "desc" : "asc" : (this._sortField = e, this._sortDirection = "asc"), this._applyFilterAndSort();
  }
  _startEdit(e) {
    this._editingId = e.id, this._formIsRegex = e.isRegex, this._formOldUrl = e.oldUrl, this._formNewUrl = e.newUrl, this._formRedirectCode = e.redirectCode, this._formNotes = e.notes;
  }
  _cancelEdit() {
    this._editingId = null, this._clearForm();
  }
  _clearForm() {
    this._formIsRegex = !1, this._formOldUrl = "", this._formNewUrl = "", this._formRedirectCode = 301, this._formNotes = "";
  }
  async _handleAdd() {
    this._errorMessage = "";
    const e = await y(this, {
      isRegex: this._formIsRegex,
      oldUrl: this._formOldUrl,
      newUrl: this._formNewUrl,
      redirectCode: this._formRedirectCode,
      notes: this._formNotes
    });
    e.success ? (this._redirects = [...this._redirects, e.newRedirect], this._applyFilterAndSort(), this._clearForm()) : this._errorMessage = e.message;
  }
  async _handleUpdate() {
    if (this._editingId === null) return;
    this._errorMessage = "";
    const e = {
      id: this._editingId,
      isRegex: this._formIsRegex,
      oldUrl: this._formOldUrl,
      newUrl: this._formNewUrl,
      redirectCode: this._formRedirectCode,
      notes: this._formNotes,
      lastUpdated: null
    }, t = await v(this, e);
    if (t.success) {
      const r = this._redirects.findIndex((a) => a.id === this._editingId);
      r > -1 && (this._redirects[r] = t.updatedRedirect, this._redirects = [...this._redirects]), this._editingId = null, this._clearForm(), this._applyFilterAndSort();
    } else
      this._errorMessage = t.message;
  }
  async _handleDelete(e) {
    if (!confirm("Are you sure you want to delete this redirect?")) return;
    this._errorMessage = "";
    const t = await R(this, e.id);
    t.success ? (this._redirects = this._redirects.filter((r) => r.id !== e.id), this._applyFilterAndSort()) : this._errorMessage = t.message;
  }
  async _handleDeleteAll() {
    if (!confirm("Are you sure you want to delete all redirects?")) return;
    this._errorMessage = "";
    const e = await U(this);
    e.success ? (this._redirects = [], this._applyFilterAndSort()) : this._errorMessage = e.message;
  }
  async _handleClearCache() {
    await k(this), this._cacheCleared = !0, await this._fetchRedirects(), setTimeout(() => {
      this._cacheCleared = !1;
    }, 3e3);
  }
  async _handleExport(e) {
    await I(this, e);
  }
  _openImportDialog() {
    this._showImportDialog = !0, this._importFile = null, this._importOverwrite = !1, this._importMessage = "", this._importErrors = [];
  }
  _closeImportDialog() {
    this._showImportDialog = !1, this._fetchRedirects();
  }
  _onImportFileChange(e) {
    var r;
    const t = e.target;
    this._importFile = ((r = t.files) == null ? void 0 : r[0]) ?? null;
  }
  async _handleImport() {
    var t;
    if (!this._importFile) return;
    const e = await E(this, this._importFile, this._importOverwrite);
    this._importMessage = e.message, ((t = e.errorRedirects) == null ? void 0 : t.length) > 0 ? this._importErrors = e.errorRedirects.map((r, a) => ({
      entry: a + 1,
      message: r.notes,
      oldUrl: r.oldUrl,
      newUrl: r.newUrl,
      redirectCode: r.redirectCode
    })) : this._importErrors = [];
  }
  _formatDate(e) {
    if (!e) return "";
    const t = new Date(e);
    return t.toLocaleDateString() + " " + t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  _sortIndicator(e) {
    return this._sortField !== e ? "" : this._sortDirection === "asc" ? " ▲" : " ▼";
  }
  render() {
    return l`
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
            @click=${() => this._handleExport("Csv")}
          ></uui-button>
          <uui-button
            label="Export Excel"
            look="secondary"
            @click=${() => this._handleExport("Excel")}
          ></uui-button>
          <uui-button
            label="Clear Cache"
            look="secondary"
            @click=${this._handleClearCache}
          ></uui-button>
          ${this._cacheCleared ? l`<span class="cache-cleared">Cache Cleared!</span>` : h}
          <uui-button
            label="Delete All"
            look="primary"
            color="danger"
            @click=${this._handleDeleteAll}
          ></uui-button>
        </div>
      </div>

      ${this._errorMessage ? l`
            <div class="error-bar">
              <span>Error: ${this._errorMessage}</span>
              <button @click=${() => this._errorMessage = ""}>&times;</button>
            </div>
          ` : h}

      <div class="toolbar">
        <span class="count">${this._filteredRedirects.length} redirects</span>
        <uui-input
          placeholder="Search redirects..."
          .value=${this._searchTerm}
          @input=${this._onSearchInput}
        ></uui-input>
      </div>

      ${this._loading ? l`<uui-loader-bar></uui-loader-bar>` : l`
            <table>
              <thead>
                <tr>
                  <th @click=${() => this._sort("isRegex")}>Regex${this._sortIndicator("isRegex")}</th>
                  <th @click=${() => this._sort("oldUrl")}>Old URL${this._sortIndicator("oldUrl")}</th>
                  <th @click=${() => this._sort("newUrl")}>New URL${this._sortIndicator("newUrl")}</th>
                  <th @click=${() => this._sort("redirectCode")}>Type${this._sortIndicator("redirectCode")}</th>
                  <th @click=${() => this._sort("notes")}>Notes${this._sortIndicator("notes")}</th>
                  <th @click=${() => this._sort("lastUpdated")}>Last Updated${this._sortIndicator("lastUpdated")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this._pagedRedirects.map(
      (e) => this._editingId === e.id ? this._renderEditRow(e) : this._renderRow(e)
    )}
                ${this._editingId === null ? this._renderAddRow() : h}
              </tbody>
            </table>

            <div class="pagination">
              <uui-button
                label="Previous"
                look="secondary"
                ?disabled=${this._currentPage <= 1}
                @click=${() => {
      this._currentPage--;
    }}
              ></uui-button>
              <span>Page ${this._currentPage} of ${this._totalPages}</span>
              <uui-button
                label="Next"
                look="secondary"
                ?disabled=${this._currentPage >= this._totalPages}
                @click=${() => {
      this._currentPage++;
    }}
              ></uui-button>
              <div class="page-size">
                ${[10, 25, 50, 100].map(
      (e) => l`
                    <uui-button
                      label="${e}"
                      look=${this._pageSize === e ? "primary" : "secondary"}
                      compact
                      @click=${() => {
        this._pageSize = e, this._currentPage = 1;
      }}
                    ></uui-button>
                  `
    )}
              </div>
            </div>
          `}

      ${this._showImportDialog ? this._renderImportDialog() : h}
    `;
  }
  _renderRow(e) {
    return l`
      <tr>
        <td><uui-icon name=${e.isRegex ? "icon-check" : "icon-delete"}></uui-icon></td>
        <td>
          ${e.isRegex ? l`<span>${e.oldUrl || "/"}</span>` : l`<a href=${e.oldUrl || "/"} target="_blank">${e.oldUrl || "/"}</a>`}
        </td>
        <td><a href=${e.newUrl} target="_blank">${e.newUrl}</a></td>
        <td>${e.redirectCode === 301 ? "Permanent" : "Temporary"}</td>
        <td>${e.notes}</td>
        <td>${this._formatDate(e.lastUpdated)}</td>
        <td class="actions">
          <uui-button label="Edit" look="secondary" compact @click=${() => this._startEdit(e)}></uui-button>
          <uui-button label="Delete" look="secondary" color="danger" compact @click=${() => this._handleDelete(e)}></uui-button>
        </td>
      </tr>
    `;
  }
  _renderEditRow(e) {
    return l`
      <tr class="add-form">
        <td>
          <uui-toggle
            .checked=${this._formIsRegex}
            @change=${(t) => this._formIsRegex = t.target.checked}
          ></uui-toggle>
        </td>
        <td>
          <uui-input
            placeholder="Old URL"
            .value=${this._formOldUrl}
            @input=${(t) => this._formOldUrl = t.target.value}
          ></uui-input>
        </td>
        <td>
          <uui-input
            placeholder="New URL"
            .value=${this._formNewUrl}
            @input=${(t) => this._formNewUrl = t.target.value}
          ></uui-input>
        </td>
        <td>
          <uui-select
            .value=${String(this._formRedirectCode)}
            @change=${(t) => this._formRedirectCode = Number(t.target.value)}
            .options=${[
      { name: "Permanent (301)", value: "301", selected: this._formRedirectCode === 301 },
      { name: "Temporary (302)", value: "302", selected: this._formRedirectCode === 302 }
    ]}
          ></uui-select>
        </td>
        <td>
          <uui-input
            placeholder="Notes"
            .value=${this._formNotes}
            @input=${(t) => this._formNotes = t.target.value}
          ></uui-input>
        </td>
        <td></td>
        <td class="">
            <div class="actions">
              <uui-button label="Save" look="primary" color="positive" compact @click=${this._handleUpdate}></uui-button>
              <uui-button label="Cancel" look="secondary" compact @click=${this._cancelEdit}></uui-button>
          </div>
        </td>
      </tr>
    `;
  }
  _renderAddRow() {
    return l`
      <tr class="add-form">
        <td>
          <uui-toggle
            .checked=${this._formIsRegex}
            @change=${(e) => this._formIsRegex = e.target.checked}
          ></uui-toggle>
        </td>
        <td>
          <uui-input
            placeholder="Old URL"
            .value=${this._formOldUrl}
            @input=${(e) => this._formOldUrl = e.target.value}
          ></uui-input>
        </td>
        <td>
          <uui-input
            placeholder="New URL"
            .value=${this._formNewUrl}
            @input=${(e) => this._formNewUrl = e.target.value}
          ></uui-input>
        </td>
        <td>
          <uui-select
            .value=${String(this._formRedirectCode)}
            @change=${(e) => this._formRedirectCode = Number(e.target.value)}
            .options=${[
      { name: "Permanent (301)", value: "301", selected: this._formRedirectCode === 301 },
      { name: "Temporary (302)", value: "302", selected: this._formRedirectCode === 302 }
    ]}
          ></uui-select>
        </td>
        <td>
          <uui-input
            placeholder="Notes"
            .value=${this._formNotes}
            @input=${(e) => this._formNotes = e.target.value}
          ></uui-input>
        </td>
        <td></td>
        <td class="">
            <div class="actions">
                <uui-button label="Add" look="primary" compact @click=${this._handleAdd}></uui-button>
            </div>
        </td>
      </tr>
    `;
  }
  _renderImportDialog() {
    return l`
      <div class="dialog-overlay" @click=${(e) => {
      e.target === e.currentTarget && this._closeImportDialog();
    }}>
        <div class="dialog">
          <h2>Import Redirects</h2>
          <input
            type="file"
            accept=".csv,.xlsx"
            @change=${this._onImportFileChange}
          />

          ${this._importFile ? l`
                <div class="import-toggle">
                  <span>Overwrite existing redirects?</span>
                  <uui-toggle
                    .checked=${this._importOverwrite}
                    @change=${(e) => this._importOverwrite = e.target.checked}
                    label=${this._importOverwrite ? "Overwrite" : "Don't overwrite"}
                  ></uui-toggle>
                </div>
              ` : h}

          ${this._importMessage ? l`<div class="import-message">${this._importMessage}</div>` : h}

          ${this._importErrors.length > 0 ? l`
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
      (e) => l`
                        <tr>
                          <td>${e.entry}</td>
                          <td>${e.message}</td>
                          <td>${e.oldUrl}</td>
                          <td>${e.newUrl}</td>
                          <td>${e.redirectCode}</td>
                        </tr>
                      `
    )}
                  </tbody>
                </table>
              ` : h}

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
};
i.styles = b`
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
o([
  s()
], i.prototype, "_redirects", 2);
o([
  s()
], i.prototype, "_filteredRedirects", 2);
o([
  s()
], i.prototype, "_searchTerm", 2);
o([
  s()
], i.prototype, "_loading", 2);
o([
  s()
], i.prototype, "_errorMessage", 2);
o([
  s()
], i.prototype, "_cacheCleared", 2);
o([
  s()
], i.prototype, "_sortField", 2);
o([
  s()
], i.prototype, "_sortDirection", 2);
o([
  s()
], i.prototype, "_currentPage", 2);
o([
  s()
], i.prototype, "_pageSize", 2);
o([
  s()
], i.prototype, "_editingId", 2);
o([
  s()
], i.prototype, "_formIsRegex", 2);
o([
  s()
], i.prototype, "_formOldUrl", 2);
o([
  s()
], i.prototype, "_formNewUrl", 2);
o([
  s()
], i.prototype, "_formRedirectCode", 2);
o([
  s()
], i.prototype, "_formNotes", 2);
o([
  s()
], i.prototype, "_showImportDialog", 2);
o([
  s()
], i.prototype, "_importFile", 2);
o([
  s()
], i.prototype, "_importOverwrite", 2);
o([
  s()
], i.prototype, "_importMessage", 2);
o([
  s()
], i.prototype, "_importErrors", 2);
i = o([
  w("simple-redirects-dashboard")
], i);
export {
  i as default
};
