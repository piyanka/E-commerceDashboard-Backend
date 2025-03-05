const express = require('express');
const cors = require('cors')
require('./db/config');
const User = require('./db/user');
const Product = require('./db/product');
const Jwt = require('jsonwebtoken');
const JwtKey = 'e-comm';

const app = express();
app.use(express.json())
app.use(cors())

app.post("/register", async (req, resp) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({ result }, JwtKey, { expiresIn: '2h' }, (err, token) => {
        if (err) {
            resp.send({ result: "something went wrong, Please try after sometime " });
        }
        else {
            resp.send({ result, auth: token });
        }
        // resp.send({result, auth: token});
    })

});

app.post("/login", async (req, resp) => {
    const user = await User.findOne(req.body).select("-password");
    if (req.body.password && req.body.email) {
        if (user) {
            Jwt.sign({ user }, JwtKey, { expiresIn: '2h' }, (err, token) => {
                if (err) {
                    console.log(err)
                    resp.send({ result: "something went wrong, Please try after sometime " });
                }
                else {
                    resp.send({ user, auth: token });
                }
                // resp.send({ user, auth: token });

            })
        }
        else {
            resp.send({ result: "No User Found" });
        }

    }
    else {
        resp.send({ result: 'No User Found' });
    }



})
app.post('/add-product', verifyToken, async (req, resp) => {
    let product = new Product(req.body);
    let result = await product.save()
    resp.send(result);
})

app.get('/product', verifyToken, async (req, resp) => {
    const products = await Product.find();
    if (products.length > 0) {
        resp.send(products)
    }
    else {
        resp.send({ result: "No Product Found" });
    }

})

app.delete('/product/:id', verifyToken, async (req, resp) => {
    const result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result);
})

app.get('/product/:id', verifyToken, async (req, resp) => {
    const result = await Product.findOne({ _id: req.params.id });
    if (result) {
        resp.send(result);
    }
    else {
        resp.send({ result: "No Result Found" });
    }

})

app.put('/product/:id', verifyToken, async (req, resp) => {
    const result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }

    )
    resp.send(result);
})

app.get('/search/:key', verifyToken, async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { company: { $regex: req.params.key } }


        ]
    });
    resp.send(result);
})

function verifyToken(req, resp, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];
        Jwt.verify(token, JwtKey, (err, valid) => {
            if (err) {
                resp.status(401).send({ result: "Please provide valid token" });
            }
            else {
                next();
            }
        })
    }
    else {
        resp.status(403).send({ result: 'Please provide token with headers' })
    }

};
app.get('/', (req, resp) => {
    // console.log('This is get method');
    resp.send("App is active...");

})

app.listen(5000, () => {
    console.log("Server is working...")
});