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
  password_hash VARCHAR(512)    NOT NULL,
  salt          VARCHAR(128)    NOT NULL,
  role          INTEGER         NOT NULL    DEFAULT 0,
  local_id      INTEGER         NOT NULL,

  UNIQUE (login)
);

INSERT INTO user (id, name, login, password_hash, salt, role, local_id) VALUES (1, 'changeme', 'changeme', '8dafda1ebd01cbdd9484c8ecaa58b81462f21b5de1e9c7491402c5971d22fd456a5648e73470d6aa13309b4a4eee90ee7f872a3e0c9abd7cea2d8d8b40c9ea58e6bb3776a1b0c1d89bb4b36da696bca0bee804b1eb26f119c40e29a1a0ea236d5f8fcf2133016254a4e338f68572cceece62171815bd715e4b6ffbe89942be30694ec4b969593dbc1276e8440bd9e2fff56d203455d9d31c6f831cab23a082e1371d1dd7a51f4a00938895be676b3e0f7e7ba2166f939e1f1c1e2b5b5981fa7956e74d0c78bd17e5061eab7ae7b5ad443c41fb8f2101f1c1d9623325b0b61e7cf7b91a3941686a4afaa8c67ecf2c71742497c4549e4fe35d6b4ce235fc0666cd2b4d88d847369c457346aa7357fbb8ec899e7cb76c875204a268e9365362b6f866b2463147790dabf76f8e8d3763d7e079067e1a52c2e85eb49907953208d9409443f69a8b469d2da2cd54ea9ee5d573f08088d47308ba741a751b4058bd6edd5395b242b5d5fdc44945d3f616703ed832efc27971f2b2a813a2e984e12f331968621212c84fae9d77183a1370ae5b0dc389d1ec5e01a51f4381a3a84e63c54b06f1191936d287a99d21f4b6fc215ce28a4ede721aef4c021095771f7f07c8e03a19481038f6d23325d4fac322bcbc6f33cae6b8fd2f523a61a170292559f7e8118ddf4bc2cda7d31d5885bd9a4cbfbc1c831d283fa9f31a283dd15c52733fd6', '60d75f1ebee4e71c8771ac2cc540d549388a32fcf3bee731543a02dd954018c2bbffb6be60885374ff3667b63e99a6d03528d41fae14380f10f27a92cea0c09012413d740292dfa67e6f0fa90f315ee6d31275ecb09a19df872890f0934ad3e17447ffd94e7e242dbf54c6dc0f21ad45eb7284b32184e349cc01f6fbfa9fd276', 1, -1);

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
