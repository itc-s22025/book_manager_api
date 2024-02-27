import express from 'express';
import passport from "passport";
import {check, validationResult} from "express-validator";
import {calcHash, generateSalt} from "../util/auth.js";
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient()

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({message: '/usersのルートのとこだよ〜'});
});

//ログイン認証
router.post("/login", passport.authenticate("local", {
  //認証通った場合
  successReturnToOrRedirect: "/",
  //失敗した場合
  failureRedirect: "/SignIn",
  failureMessage: true,
  keepSessionInfo: true
}))

//sign up
router.post('/signup', [
  check('email', '名前の入力は必須です').notEmpty(),
  check('password', 'パスワードの入力は必須です').notEmpty()
], async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array();
      console.log(errors);
      return res.status(400).json({ errors: errors });
    }
    // OKだったらDB登録へ
    const { email, name, password, isAdmin } = req.body;
    const salt = generateSalt();
    const hashedPassword = calcHash(password, salt);

    await prisma.users.create({
      data: {
        email,
        name,
        password: hashedPassword,
        salt,
        isAdmin
      }
    });
    return res.status(201).json({ message: 'ユーザ登録できたよ〜', res: email });
  } catch (e) {
    switch (e.code){
      case "P2002":
        res.status(400).json({message: "すでに使われているユーザー名かも"});
        break;
      default:
        console.error(e);
        res.status(500).json({ message: 'サーバーエラー' });
    }
    return console.error(e)
  }
});

export default router;