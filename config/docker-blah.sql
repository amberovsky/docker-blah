CREATE TABLE project(
  id    INTEGER       PRIMARY KEY AUTOINCREMENT,
  name  VARCHAR(100)  NOT NULL    DEFAULT ''
);

INSERT INTO project (id, name) VALUES (1, 'Prj1');
INSERT INTO project (id, name) VALUES (2, 'Prj2');

CREATE TABLE node(
  id          INTEGER       PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER       NOT NULL,
  name        VARCHAR(100)  NOT NULL    DEFAULT '',
  ip          CHAR(15)      NOT NULL
);

INSERT INTO node (id, project_id, name, ip) VALUES (1, 1, 'FT APP', '123');
INSERT INTO node (id, project_id, name, ip) VALUES (2, 1, 'FT DB', '123');
INSERT INTO node (id, project_id, name, ip) VALUES (3, 1, 'RC APP', '123');
INSERT INTO node (id, project_id, name, ip) VALUES (4, 1, 'RC DB', '123');
INSERT INTO node (id, project_id, name, ip) VALUES (5, 2, 'qwe', 'eee');

CREATE TABLE user(
  id            INTEGER         PRIMARY KEY AUTOINCREMENT,
  name          VARCHAR(100)    NOT NULL    DEFAULT '',
  login         VARCHAR(16)     NOT NULL,
  password_hash VARCHAR(32)     NOT NULL,
  role          INTEGER         NOT NULL    DEFAULT 0
);

INSERT INTO user (id, name, login, password_hash, role) VALUES (1, 'Anton Zagorskii', 'amberovsky', '1', 1);

CREATE TABLE project_user(
  project_id  INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  role        INTEGER NOT NULL
);

INSERT INTO project_user(project_id, user_id, role) VALUES (1, 1, 1);
