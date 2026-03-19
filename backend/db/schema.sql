USE defrost_app;
DROP USER IF EXISTS 'defrostuser'@'%';
CREATE USER 'defrostuser'@'%' IDENTIFIED BY 'impreza';
GRANT ALL PRIVILEGES ON defrost_app.* TO 'defrostuser'@'%';
FLUSH PRIVILEGES;

DROP TABLE IF EXISTS defrost_users;

CREATE TABLE defrost_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
