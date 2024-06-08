CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL UNIQUE,
    author_name VARCHAR(50) NOT NULL,
    cover_id CHAR(30) UNIQUE,
    author_key VARCHAR(50),
    preview TEXT, 
    ranks VARCHAR(20),
    publish_date VARCHAR(50)
);

INSERT INTO books (title, author_name, cover_id, author_key, preview, ranks, publish_date)
VALUES ('Harry Potter', 'James K', 123456, 1, 'This is the preview text to fake the content of the book', 10/10, '28-May-2024'),
        ('Nightmares', 'William Khris', 762, 2, 'Nightmares Content', 9/10, '29-May-2024');
