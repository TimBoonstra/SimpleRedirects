using Umbraco.Cms.Infrastructure.Migrations;

namespace SimpleRedirects.Core.Migrations
{
    public class RegexMigration : AsyncMigrationBase
    {
        public RegexMigration(IMigrationContext context) : base(context)
        {
        }

        protected override async Task MigrateAsync()
        {
            if (!ColumnExists("Redirects", "IsRegex"))
            {
                Alter.Table("Redirects").AddColumn("IsRegex").AsBoolean().Nullable().Do();
            }
        }
    }
}
