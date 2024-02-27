import express from 'express';
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient()

//ログインチェック 管理者ユーザならアクセスできる
router.use((req, res, next) => {
    if (req.user && req.user.isAdmin === true) {
        next();
    } else {
        res.status(403).json({ message: "NG" }); // 管理者でない場合はアクセス拒否
    }
})

router.get("/", async (req, res, next)=> {
    res.json({msg: "admin/book"})
})


//書籍情報登録
router.post('/create', async (req, res, next) => {
    try {
        const {isbn13, title, author, publishDate} = req.body;
        const register = await prisma.books.create({
            data:{
                isbn13,
                title,
                author,
                publishDate
            }
        })
        res.status(200).json({message: "OK"})

    }catch (e) {
        console.log(e)
        res.status(400).json({message: "NG"})
    }
})

export default router;