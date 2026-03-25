# Supabase Migrations

This directory contains the SQL migration scripts for setting up and evolving the iPOS database schema.

## How to Apply Migrations

These migrations are designed to be run using the [Supabase CLI](https://supabase.com/docs/guides/cli).

### First Time Setup

If you are setting up a new Supabase project (local or remote), you can apply all migrations to create the database schema from scratch.

1.  **Link your project:**
    ```bash
    supabase link --project-ref <your-project-ref>
    ```

2.  **Push the migrations:**
    This command will run all the migration files in this directory against your linked Supabase database.
    ```bash
    supabase db push
    ```

This will create all the tables, functions, triggers, and RLS policies defined in the `_initial_schema.sql` file.

### Creating New Migrations

When you need to make changes to the database schema (e.g., add a column, create a new table):

1.  **Make changes locally:** It's recommended to make schema changes using the Supabase Studio on your local instance.

2.  **Generate a new migration file:**
    Run the following command to diff your local database changes and create a new migration file.
    ```bash
    supabase db diff -f <migration-name>
    ```
    For example:
    ```bash
    supabase db diff -f add_notes_to_products
    ```

3.  **Apply the new migration:**
    Push the newly created migration file to your remote database.
    ```bash
    supabase db push
    ```
