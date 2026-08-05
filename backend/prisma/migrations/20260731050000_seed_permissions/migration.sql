INSERT INTO "Permission" ("name")
VALUES
  ('scheduler:create'),
  ('scheduler:read'),
  ('scheduler:update'),
  ('scheduler:delete'),
  ('role:create'),
  ('role:read'),
  ('role:update'),
  ('role:delete'),
  ('permission:create'),
  ('permission:read'),
  ('permission:update'),
  ('permission:delete')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."name" = 'ADMIN'
  AND p."name" IN (
    'scheduler:create',
    'scheduler:read',
    'scheduler:update',
    'scheduler:delete',
    'role:create',
    'role:read',
    'role:update',
    'role:delete',
    'permission:create',
    'permission:read',
    'permission:update',
    'permission:delete'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."name" = 'USER'
  AND p."name" IN ('scheduler:create', 'scheduler:read')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;