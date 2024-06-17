import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from "bcrypt";
import session from "express-session";
import passport from 'passport';
import { Strategy } from 'passport-local';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const saltRounds = 10;

//Middlewares
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(join(__dirname, 'public')));

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use(session({
    secret: "SECRETWORD",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

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

app.get("/", (req, res) => {
    res.redirect("/login");
})

app.get("/books", async (req, res) => {
    if (req.isAuthenticated()) {
        console.log("Req User: ", req.user);
        const result = await db.query('SELECT * FROM books WHERE user_id = $1', [req.user.id]);
        const books = result.rows;
        console.log(books);
        res.render("index.ejs", {books})
    } else {
        res.redirect("/login");
    }
})

// app.get("/home", 
//     passport.authenticate(
//         "local",
//         {
//             successRedirect: "/books",
//             failureRedirect: "/login"
//         }
//     )
// )

// app.get('/', async (req, res) => {
//     try {
//         const result = await db.query('SELECT * FROM books ORDER BY title ASC');
//         books = result.rows;
//         res.render('index.ejs', {books});
//     } catch (err) {
//         console.log(err.message);
//     }
// })

app.get("/register", (req, res) => {
    try {
        res.render("register.ejs");
    } catch (err) {
        console.log(err);
    }
})

app.get("/login", (req, res) => {
    try {
        res.render("login.ejs");
    } catch (err) {
        console.log(err);
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
        res.redirect('/books');
    } catch (err) {
        console.log(err.message);
    }
})

app.post('/add', async (req, res) => {
    try {
        const book = JSON.parse(req.body.bookData);
        console.log("User in request in add book route: ", req.user);
        const coverImgM = "https://covers.openlibrary.org/b/isbn/" + book['isbn'][0] + "-M.jpg";
        const coverImgL = "https://covers.openlibrary.org/b/isbn/" + book['isbn'][0] + "-L.jpg";
        const authorImg = "https://covers.openlibrary.org/a/olid/" + book['author_key'][0] + "-M.jpg";
        // Check if the book already exist in database 
        const result = await db.query("SELECT * FROM books WHERE title = $1", [book.title]);
        if (!result.rows.length) {
            if (book && book['first_sentence']) {
                db.query('INSERT INTO books (title, author_name, author_key, cover_m, cover_l, preview, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)', [book.title, book['author_name'][0], authorImg, coverImgM, coverImgL, book['first_sentence'][0], req.user.id ]);
            } else {
                db.query('INSERT INTO books (title, author_name, author_key, cover_m, cover_l, user_id) VALUES ($1, $2, $3, $4, $5, $6)', [book.title, book['author_name'][0], authorImg, coverImgM, coverImgL, req.user.id]);
            }
        } 
        res.redirect('/books');
    } catch(err) {
        console.log(err.message);
    }
})

app.post("/register/post", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);
        console.log(username, password);
        if (result.rows.length) {
            res.redirect("/login");
        } else {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                    console.log(err);
                } else {
                    const result = await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [username, hash])
                    const user = result.rows[0];
                    req.login(user, err => {
                        console.log(err);
                        res.redirect("/books");
                    })
                }
            })
        } 
    } catch(err) {
        console.log(err);
    }
})

app.post(
    "/login", 
    passport.authenticate("local", {
        failureRedirect: "/login",
        successRedirect: "/books"},
    )
);

// Configure For Local Authentication
passport.use(
    new Strategy("local", 
        async (username, loginPassword, cb) => {
            const result = await db.query("SELECT * FROM users WHERE email=$1", [username]);
            if (result.rows.length) {
                const user = result.rows[0];
                const hashedStoredPassword = user.password;
                bcrypt.compare(loginPassword, hashedStoredPassword, (err, match) => {
                    if (err) cb(err);
                    if (match) {
                        cb(null, user);
                    } else {
                        cb(null, false, {message: "Incorrect Password :("});
                    }
                })
            } else {
                cb(null, false, {message: "User does not exist!"});
            }
        }
    )
);

passport.serializeUser((user, cb) => {
    cb(null, user);
})

passport.deserializeUser((user, cb) => {
    cb(null, user); 
})

app.listen(port, () => {
    console.log("Server is running on port ", port);
})



