const express = require('express');
const path = require('path');
const handlebars = require('express-handlebars');

const { PORT } = require("./constants/config");
const { users } = require("./db/users");

const app = express();

const templatesPath = path.join(__dirname, 'static');

app.use(express.static(templatesPath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', '.hbs');
app.engine('.hbs', handlebars({ defaultLayout: false }));
app.set('views', templatesPath);

const validateEmail = (email) => {
    // I can use Joi or express-validator, but it isn't in task, so...
    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegexp.test(email);
};


const getUserByEmail = (email) => {
    return users.find((user) => user.email === email);
}


app.get('/register', (req, res) => {
    return res.render('register');
});

app.post('/register', (req, res) => {
    const { email, password } = req.body;

    const validationResult = validateEmail(email);

    if (!validationResult) {
        res.status(400).json({ message: 'Incorrect format of email' });
        return;
    }

    const existsUser = getUserByEmail(email);

    if (existsUser) {
        res.redirect('/error/Email already in use/login/Login');
        return;
    }

    users.push({
        email,
        password,
        id: Date.now() // Id can be same, but for this app it is good
    });

    return res.status(201).redirect('/login');
})


app.get('/login', (req, res) => {
   return res.render('login');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const validationResult = validateEmail(email);

    if (!validationResult) {
        res.redirect('/error/Incorrect format of email/login/Login');
        return;
    }

    const user = getUserByEmail(email);

    if (!user || !(user?.password === password)) {
        res.redirect('/error/Incorrect credentials/login/Login');
        return;
    }

    return res.redirect('/users');

});


app.get('/users', (req, res) => {
   return res.render('users', { users: users });
});


app.get('/error/:errorText/:linkUrl/:linkTitle', (req, res) => {
    return res.render('error', { ...req.params });
});


app.get('/users/:userId', (req, res) => {
    const { userId } = req.params;

    const user = users.find((user) => user.id === Number(userId));

    if (!user) {
        res.redirect('/error/User not found/users/Users');
        return;
    };

    return res.render('user', { email: user.email, id: user.id, password: user.password })
})

app.listen(PORT, () => {
    console.log(`Server run at port ${PORT}`);
});
