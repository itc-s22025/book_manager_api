import express from 'express';
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient()

//ログインチェック
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

export default router;