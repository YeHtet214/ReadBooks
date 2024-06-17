function handler(id) {
    document
        .getElementById(`book-detail${id}`)
        .setAttribute("class", "hidden");
    document
        .getElementById(`edit-btn${id}`)
        .classList.add("hidden");
    document
        .getElementById(`edit-paragraph${id}`)
        .removeAttribute("class", "hidden");
    document
        .getElementById(`submit-edit${id}`)
        .classList.remove("hidden");
    document
        .getElementById(`delete${id}`)
        .setAttribute("class", "hidden");
}

function setInitial(id) {
    document
        .getElementById(`book-detail${id}`)
        .removeAttribute("class", "hidden");
    document
        .getElementById(`edit-btn${id}`)
        .classList.remove("hidden");
    document
        .getElementById(`edit-paragraph${id}`)
        .setAttribute("class", "hidden");
    document
        .getElementById(`submit-edit${id}`)
        .classList.add("hidden");
    document
        .getElementById(`delete${id}`)
        .removeAttribute("class", "hidden");
}

function toogleLabel(input) {
    const parentFormGpTag = input.parentElement;
    const label = parentFormGpTag.querySelector("label");
    if (label.classList.contains("focused")) {
        if (!input.value) {
            label.classList.remove("focused");
            return;
        }
    }
    label.classList.add("focused");
}

const searchUlParentTag = document.querySelector('#search + ul');
const addUlParentTag = document.querySelector('#add-book + ul');

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    }
}

// Set the debounce state for the purpose of delay api call
const debouncedAddBook = debounce(addBook, 1000);

const searchInput = document.getElementById('search');
const addInput = document.getElementById('add-book');

let suggestedBookList = [];

searchInput.addEventListener('input', (event) => {
    eventHandler(event.target);
})

addInput.addEventListener('input', (event) => {
    eventHandler(event.target);
})

function eventHandler(target) {
    const input = target.value.trim();
    const targetId = target.id;
    // Clear the suggested list ui 
    document.querySelectorAll('.drop-down ul').forEach(element => element.innerHTML = '');
    suggestedBookList = [];
    
    switch (targetId) {
        case 'search':
            searchBook(input, targetId);
            break;
        case 'add-book':
            debouncedAddBook(input, targetId);
            break;
    }
}

// To get the books from existing database
async function searchBook(query, targetId) {
    const url = 'http://localhost:3000/getBooks';

    await fetch(url)
        .then(res => res.json())
        .then(data => data.rows.forEach(book => {
            if (query && book.title.toLowerCase().includes(query)) {
                suggestedBookList.push(book);
            }
        }))
        .catch(err => console.log(err.message));

    updateUI(targetId);
}

// To list the books returned from api call
async function addBook(query, targetId) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=title,author_name,author_key,isbn,first_sentence&limit=5`;

    suggestedBookList = await fetch(url)
                            .then(res => res.json())
                            .then(data => data.docs)
                            .catch(err => console.log(err.message));

    updateUI(targetId);
}

async function updateUI(targetId) {
    if (!suggestedBookList.length) {
        document.querySelectorAll('.drop-down ul').forEach(ul => ul.innerHTML = '');
        return;
    }

    suggestedBookList.forEach(book => {
        const li = document.createElement('li');
        li.setAttribute('class', 'suggested-book');

        if (targetId === 'search') {
            li.innerHTML = `<a href=/detail/${book.id}>${book.title}</a>`;
            searchUlParentTag.appendChild(li);
        } else if (targetId === 'add-book') {
            const pTag = document.createElement('p');
            pTag.setAttribute('class', 'available-book');
            pTag.setAttribute('id', `p${book.cover_i}`)
            pTag.setAttribute('onclick', "selectSuggestedBook(this)");
            pTag.innerText = book.title;
            li.append(pTag);
            addUlParentTag.appendChild(li);
        }
    })
}

// Set the selected book in input to send data to the server
function selectSuggestedBook(target = null) {
    addUlParentTag.innerHTML = '';
    addInput.value = '';

    if (!target) return;

    const selectedBookTitle = target.innerText;
    const bookDataInput = document.getElementById('bookData');
    const selectedBookData = suggestedBookList.filter(book => (book.title === selectedBookTitle));
    bookDataInput.value = JSON.stringify(selectedBookData[0]);
    addInput.value = selectedBookTitle;
    document.getElementById('add-book-submit').removeAttribute('disabled');
}

