using SimpleRedirects.Core.Models;
using Umbraco.Cms.Infrastructure.Migrations;

namespace SimpleRedirects.Core.Migrations
{
    public class InitialMigration : AsyncMigrationBase
    {
        public InitialMigration(IMigrationContext context) : base(context)
        {
        }

        protected override async Task MigrateAsync()
        {
            if (!TableExists("Redirects"))
            {
                Create.Table<Redirect>().Do();
            }
        }
    }
}
