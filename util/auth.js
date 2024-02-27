import crypto from "node:crypto";
import {Strategy as LocalStrategy} from "passport-local";
import {PrismaClient} from "@prisma/client";

//scrypt関連の定数値
const N = Math.pow(2, 17);
const maxmem = 144 * 1024 * 1024;
const keyLen = 192;
const saltSize = 64;

/**
 * Salt用のランダムバイト列生成
 * @return {Buffer}
 */
export const generateSalt = () => crypto.randomBytes(saltSize);

/**
 * パスワードハッシュ値計算
 * @param {String} plain
 * @param {Buffer} salt
 * @return {Buffer}
 */
export const calcHash = (plain, salt) => {
    const normalized = plain.normalize();
    const hash = crypto.scryptSync(normalized, salt, keyLen, {N, maxmem});
    if (!hash) {
        throw Error("ハッシュ計算エラー");
    }
    return hash;
};

/**
 * Passport.js の設定
 */
const config = (passport) => {
    const prisma = new PrismaClient();

    // データベースに問い合わせてユーザ名:パスワードをチェックして認証する部分
    passport.use(new LocalStrategy({
        usernameField: "email", passwordField: "password"
    }, async (username, password, done) => {
        try {
            const user = await prisma.users.findUnique({
                where: {email: username}
            });
            if (!user) {
                // そんなユーザいないよ
                return done(null, false, {message: "ユーザ名かパスワードが違います"});
            }
            const hashedPassword = calcHash(password, user.salt);
            if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
                // パスワードが違うよ
                return done(null, false, {message: "ユーザ名かパスワードが違います"});
            }
            // 認証OK
            return done(null, user);
        } catch (e) {
            return done(e);
        }
    }));

    //ユーザーが認証されたとき(passport.authenticateが成功したとき)
    // セッションストレージにユーザデータを保存するときに呼ばれる
    passport.serializeUser((user, done) => {
        process.nextTick(() => {
            console.log("Serialize User:", user);
            done(null, {id: user.id, email: user.email});
        });
    });

    //次のリクエストがあるとき
    // セッションストレージからデータを引っ張ってくるときに呼ばれる
    passport.deserializeUser((user, done) => {
        process.nextTick(() => {
            try {
                done(null, user);
            } catch (err) {
                // エラーハンドリング
                console.error("Deserialize User Error:", err);
                done(err);
            }
        });
    });

    // セッションストレージに messages を追加するミドルウェアとして関数を作って返す
    return (req, res, next) => {
        const messages = req.session.messages || [];
        res.locals.messages = messages;
        res.locals.hasMessages = !!messages.length;
        req.session.messages = [];
        next();
    };
};

export default config;

