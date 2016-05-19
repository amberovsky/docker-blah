CREATE TABLE project(
  id      INTEGER       PRIMARY KEY AUTOINCREMENT,
  name    VARCHAR(100)  NOT NULL    DEFAULT '',
  user_id INTEGER       NOT NULL,
  ca      BLOB          NOT NULL,
  cert    BLOB          NOT NULL,
  key     BLOB          NOT NULL,
  created INTEGER       NOT NULL    DEFAULT (datetime('now')),

  UNIQUE (user_id, name)
);

INSERT INTO project (id, name, user_id, ca, cert, key) VALUES (1, 'Prj1', -1, '', '', '');
INSERT INTO project (id, name, user_id, ca, cert, key) VALUES (2, 'Prj2', -1, '', '', '');

CREATE TABLE node(
  id          INTEGER       PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER       NOT NULL,
  name        VARCHAR(100)  NOT NULL    DEFAULT '',
  ip          CHAR(15)      NOT NULL,
  port        INTEGER       NOT NULL,

  UNIQUE (project_id, name),
  UNIQUE (project_id, ip)
);

INSERT INTO node (id, project_id, name, ip, port) VALUES (1, 1, 'FT APP', '123', -1);
INSERT INTO node (id, project_id, name, ip, port) VALUES (2, 1, 'FT DB', '124', -1);
INSERT INTO node (id, project_id, name, ip, port) VALUES (3, 1, 'RC APP', '125', -1);
INSERT INTO node (id, project_id, name, ip, port) VALUES (4, 1, 'RC DB', '126', -1);
INSERT INTO node (id, project_id, name, ip, port) VALUES (5, 2, 'qwe', 'eee', -1);

CREATE TABLE user(
  id            INTEGER         PRIMARY KEY AUTOINCREMENT,
  name          VARCHAR(100)    NOT NULL    DEFAULT '',
  login         VARCHAR(16)     NOT NULL,
  password_hash VARCHAR(32)     NOT NULL,
  role          INTEGER         NOT NULL    DEFAULT 0,
  local_id      INTEGER         NOT NULL,

  UNIQUE (login)
);

INSERT INTO user (id, name, login, password_hash, role, local_id) VALUES (1, 'Anton Zagorskii', 'amberovsky', '1', 1, -1);

CREATE TABLE project_user(
  project_id  INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  role        INTEGER NOT NULL,

  UNIQUE (project_id, user_id, role)
);

INSERT INTO project_user(project_id, user_id, role) VALUES (1, 1, 1);

CREATE TABLE project_log(
  id          INTEGER     PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER     NOT NULL,
  name        VARCHAR(16) NOT NULL    DEFAULT '',
  path        VARCHAR(16) NOT NULL,

  UNIQUE (project_id, name),
  UNIQUE (project_id, path)
);
