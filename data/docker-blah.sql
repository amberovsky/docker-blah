CREATE TABLE project (
  id      INTEGER       PRIMARY KEY AUTOINCREMENT,
  name    VARCHAR(100)  NOT NULL    DEFAULT '',
  user_id INTEGER       NOT NULL,
  ca      BLOB          NOT NULL,
  cert    BLOB          NOT NULL,
  key     BLOB          NOT NULL,
  created INTEGER       NOT NULL    DEFAULT (datetime('now')),

  UNIQUE (user_id, name)
);

CREATE TABLE node (
  id          INTEGER       PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER       NOT NULL,
  name        VARCHAR(100)  NOT NULL    DEFAULT '',
  ip          CHAR(15)      NOT NULL,
  port        INTEGER       NOT NULL,

  UNIQUE (project_id, name),
  UNIQUE (project_id, ip)
);

CREATE TABLE user (
  id            INTEGER         PRIMARY KEY AUTOINCREMENT,
  name          VARCHAR(100)    NOT NULL    DEFAULT '',
  login         VARCHAR(16)     NOT NULL,
  password_hash VARCHAR(32)     NOT NULL,
  role          INTEGER         NOT NULL    DEFAULT 0,
  local_id      INTEGER         NOT NULL,

  UNIQUE (login)
);

INSERT INTO user (id, name, login, password_hash, role, local_id) VALUES (1, 'changeme', 'changeme', 'changeme', 1, -1);

CREATE TABLE project_user(
  project_id  INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  role        INTEGER NOT NULL,

  UNIQUE (project_id, user_id, role)
);

CREATE TABLE project_log (
  project_id  INTEGER       PRIMARY KEY,
  logs        VARCHAR(1024) NOT NULL    DEFAULT ''
);
