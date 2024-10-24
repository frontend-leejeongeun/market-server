//express.js
const express = require("express");
const cors = require("cors");
const app = express();
const models = require("./models");
const multer = require("multer");
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "upload/");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});
const port = 8080;

app.use(express.json()); //json 형식의 데이터를 처리할 수 있게 설정하는 코드
app.use(cors()); //브라우저의 CORS 이슈를 막기 위해 사용하는 코드
app.use("/upload", express.static("upload"));

app.get("/banners", (req, res) => {
  models.Banner.findAll({
    limit: 2,
  })
    .then(function (result) {
      res.send({
        banners: result,
      });
    })
    .catch(function (error) {
      console.error(error);
      res.status(500).send("에러가 발생했습니다.");
    });
});

app.get("/products", async (req, res) => {
  models.Product.findAll({
    limit: 100,
    order: [["createdAt", "DESC"]],
    attributes: [
      "id",
      "name",
      "price",
      "createdAt",
      "seller",
      "imageUrl",
      "soldout",
    ],
  })
    .then((result) => {
      console.log("PRODUCTS : ", result);
      res.send({
        products: result,
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(400).send("에러 발생");
    });
});

app.post("/products", async (req, res) => {
  const body = req.body;
  const { name, description, price, seller, imageUrl } = body;
  if (!name || !description || !price || !seller || !imageUrl) {
    res.status(400).send("모든 필드를 입력해주세요");
  }
  models.Product.create({
    name,
    description,
    price,
    seller,
    imageUrl,
  })
    .then((result) => {
      //생성된 레코드 {name: ..., description, ...}를 반환한다.
      console.log("상품 생성 결과", result);
      res.send({
        result,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(400).send("상품업로드에 문제가 발생했습니다.");
    });
});

app.post("/purchase/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await models.Product.update(
      {
        soldout: 1, // 결제 완료로 설정
      },
      {
        where: { id },
      }
    );

    if (result[0] === 0) {
      return res.status(404).send("해당 상품을 찾을 수 없습니다.");
    }

    res.send({ result: true });
  } catch (error) {
    console.error("구매 처리 중 에러 발생:", error);
    res.status(500).send("서버 내부 오류가 발생했습니다.");
  }
});

app.get("/products/:id", async (req, res) => {
  const param = req.params;
  const { id } = param;
  models.Product.findOne({
    where: {
      id: id,
    },
  })
    .then((result) => {
      console.log("PRODUCT : ", result);
      res.send({
        product: result,
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(400).send("상품 조회 에러 발생");
    });
});

app.post("/image", upload.single("image"), (req, res) => {
  const file = req.file;
  res.send({
    imageUrl: file.path,
  });
});

app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, price, seller, imageUrl, soldout } = req.body;

  if (!name || !description || !price || !seller || !imageUrl) {
    return res.status(400).send("모든 필드를 입력해주세요");
  }

  try {
    const result = await models.Product.update(
      {
        name,
        description,
        price,
        seller,
        imageUrl,
        soldout,
      },
      {
        where: { id },
      }
    );

    if (result[0] === 0) {
      return res.status(404).send("해당 상품을 찾을 수 없습니다.");
    }

    res.send({
      result: "상품이 성공적으로 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("상품 업데이트 중 에러 발생:", error);
    res.status(500).send("서버 내부 오류가 발생했습니다.");
  }
});

//세팅한 app을 실행시킨다.
app.listen(port, () => {
  console.log("쇼핑몰 서버가 돌아가고 있습니다.");
  models.sequelize
    .sync({ alter: true }) // 변경된 모델 스키마에 따라 테이블을 업데이트
    .then(() => {
      console.log("✓ DB 연결 성공");
    })
    .catch(function (err) {
      console.error(err);
      console.log("✗ DB 연결 에러");
      process.exit();
    });
});
