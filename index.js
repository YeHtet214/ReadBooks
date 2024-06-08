import express, { application, urlencoded } from 'express';
import axios from 'axios';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname);

//Middlewares
app.use(express.static(join(__dirname, 'public')));
app.use(urlencoded({extended: true}));

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

const db = new pg.Client({
    port: '5432',
    host: 'localhost',
    user: 'postgres',
    database: 'permalist',
    password: '123456'
});

db.connect();

let books;

// Sending data to the client side JS 
app.use('/getBooks', (req, res) => {
    db.query('SELECT * FROM books', (err, result) => {
        if (err) {
            console.log(err);
            res.status(500);
            return res.end();
        }
        res.json(result);
    })
})

app.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM books ORDER BY title ASC');
        books = result.rows;
        res.render('index.ejs', {books});
    } catch (err) {
        console.log(err.message);
    }
})

app.post('/update', (req, res) => {
    try {
        const edit = req.body.update_detail;
        const bookId = req.body.bookId;
        if (req.body.delete) {
            db.query('DELETE FROM books WHERE id = $1', [bookId]);
        }
        
        if (edit) { 
            db.query('UPDATE books SET preview = $1 WHERE id = $2', [edit.trim(), bookId]);
        } 
        res.redirect('/');
    } catch (err) {
        console.log(err.message);
    }
})

app.post('/add', async (req, res) => {
    try {
        const book = JSON.parse(req.body.bookData);
        const coverImgM = "https://covers.openlibrary.org/b/isbn/" + book['isbn'][0] + "-M.jpg";
        const coverImgL = "https://covers.openlibrary.org/b/isbn/" + book['isbn'][0] + "-L.jpg";
        const authorImg = "https://covers.openlibrary.org/a/olid/" + book['author_key'][0] + "-M.jpg";
        if (book && book['first_sentence']) {
            db.query('INSERT INTO books (title, author_name, author_key, cover_m, cover_l, preview) VALUES ($1, $2, $3, $4, $5, $6)', [book.title, book['author_name'][0], authorImg, coverImgM, coverImgL, book['first_sentence'][0] ]);
        } else {
            db.query('INSERT INTO books (title, author_name, author_key, cover_m, cover_l) VALUES ($1, $2, $3, $4, $5)', [book.title, book['author_name'][0], authorImg, coverImgM, coverImgL]);
        }
        console.log(authorImg)
        res.redirect('/');
        
    } catch(err) {
        console.log(err.message);
    }
})

// Each Book Detail Page
app.get('/detail/:id', async (req, res) => {
    try {  
        const id = req.params.id;
        const response = await db.query('SELECT * FROM books WHERE id = $1', [id]);
        const book = response.rows[0];
        console.log(book);
        res.render('detail.ejs', {book})
    } catch(err) {
        console.log(err.message);
    }
} )

app.listen(port, () => {
    console.log("Server is running on port ", port);
})



