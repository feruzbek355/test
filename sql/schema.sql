-- Schema for Fakultet News clone
CREATE DATABASE IF NOT EXISTS fakultet_news;
USE fakultet_news;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample news
INSERT INTO news (title, content) VALUES
('Fakultet ochildi', 'Yangi fakultet rasmiy tarzda ochildi. Qo\'shiling va yangiliklardan xabardor bo\'ling.'),
('Talabalar konferensiyasi', 'Talabalarimiz xalqaro konferensiyada ishtirok etdilar va sovrinlar qo\'lga kiritildi.'),
('Yangilangan o\'quv dasturi', 'O\'quv dasturimiz zamonaviylashtirildi — ko\'proq amaliy mashg\'ulotlar.');
