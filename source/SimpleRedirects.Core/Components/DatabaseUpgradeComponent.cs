using SimpleRedirects.Core.Migrations;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Migrations;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade;

namespace SimpleRedirects.Core.Components
{
    public class DatabaseUpgradeComponent : IAsyncComponent
    {
        private readonly ICoreScopeProvider _scopeProvider;
        private readonly IKeyValueService _keyValueService;
        private readonly IRuntimeState _runtimeState;
        private readonly IMigrationPlanExecutor _migrationPlanExecutor;

        public DatabaseUpgradeComponent(IMigrationPlanExecutor migrationPlanExecutor, ICoreScopeProvider scopeProvider, IKeyValueService keyValueService, IRuntimeState runtimeState)
        {
            _migrationPlanExecutor = migrationPlanExecutor;
            _scopeProvider = scopeProvider;
            _keyValueService = keyValueService;
            _runtimeState = runtimeState;
        }

        public async Task InitializeAsync(bool isRestarting, CancellationToken cancellationToken)
        {
            if (_runtimeState.Level != RuntimeLevel.Run) return;

            var plan = new MigrationPlan("SimpleRedirectsMigration");
            plan.From(string.Empty)
                .To<InitialMigration>("state-1")
                .To<RegexMigration>("state-2")
                .To<RedirectCodeMigration>("state-3")
                .To<TrimOldUrlMigration>("state-4");

            var upgrader = new Upgrader(plan);
            await upgrader.ExecuteAsync(_migrationPlanExecutor, _scopeProvider, _keyValueService);
        }

        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
