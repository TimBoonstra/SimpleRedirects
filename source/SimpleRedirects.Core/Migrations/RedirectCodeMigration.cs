using Umbraco.Cms.Infrastructure.Migrations;

namespace SimpleRedirects.Core.Migrations
{
    public class RedirectCodeMigration : AsyncMigrationBase
    {
        public RedirectCodeMigration(IMigrationContext context) : base(context)
        {
        }

        protected override async Task MigrateAsync()
        {
            if (!ColumnExists("Redirects", "RedirectCode"))
            {
                Alter.Table("Redirects").AddColumn("RedirectCode").AsInt32().NotNullable().WithDefaultValue(301).Do();
            }
        }
    }
}
