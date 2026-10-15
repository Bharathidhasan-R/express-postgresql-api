const express  = require('express');
const db = require('./db');
const routes=require('./routes/router')

const app = express();
app.use(express.json());

const PORT = process.env.API_PORT;

app.use(routes);

app.get("/", (req, res)=>{
    res.send({msg: "Root"});
});

app.listen(PORT, ()=>{
    console.log(`App is running on Port ${PORT}`);
});

// async function main() {
//     try {
//         await db.connectDB();

//         const res = await db.query('SELECT * FROM public.employees');
//         console.log(res.rows);
//     } catch (err) {
//         console.error('❌ Database error:', err.message);
//         process.exit(1);
//     }
// }

// main();