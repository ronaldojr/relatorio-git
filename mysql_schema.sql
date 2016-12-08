CREATE SCHEMA `gitlog` DEFAULT CHARACTER SET utf8 ;

CREATE TABLE `gitlog`.`repositorios` (
  `pk` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NULL,
  `endereco` VARCHAR(255) NULL,
  PRIMARY KEY (`pk`));

CREATE USER 'gitlog'@'localhost' IDENTIFIED BY 'gitlog*';

GRANT ALL PRIVILEGES ON gitlog.* TO 'gitlog'@'localhost';