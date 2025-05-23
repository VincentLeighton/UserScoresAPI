import express, { Request, Response } from "express";
import mysql, {
  QueryError,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import cors from "cors";

const app = express();
const port = 3002;

const getConnection = () => {
  // Create the connection to database
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "Users",
    password: "vincent1",
    port: 3306,
  });
};

const corsOptions = {
  origin: "*", // Allow all origins (not recommended for production)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies and authorization headers
};

getConnection().then((connection) => {
  app.use(cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req: Request, res: Response) => {
    res.send("Hello! Welcome to UsersAPI");
  });

  // GET /users - return all users
  app.get("/users", (req: Request, res: Response) => {
    connection
      .query("Select * from Users;")
      .then(([results, fields]) => {
        res.send(results);
      })
      .catch((err) => {
        console.error(err);
        res.status(500);
      });
  });

  // GET /users/id - return user by id
  app.get("/users/:id", (req: Request, res: Response) => {
    connection
      .execute("Select * from Users where ID = ?;", [req.params.id])
      .then(([results, fields]) => {
        res.send(results);
      })
      .catch((err) => {
        console.error(err);
        res.status(500);
      });
  });

  // POST /users - add a new score for user
  app.post("/score", (req: Request, res: Response) => {
    const { UserID, GameName, Score } = req.body;
    const isUserIDValid =
      UserID && UserID.length > 0 && !isNaN(parseInt(UserID));
    const isGameNameValid = GameName && GameName.length > 0;
    const isScoreValid = Score && Score.length > 0 && !isNaN(parseInt(Score));
    if (!isUserIDValid || !isGameNameValid || !isScoreValid) {
      res.status(400).json({
        error: "Invalid required fields. Stop breaking my endpoints QA",
      });
      return;
    }

    connection
      .execute(
        "INSERT INTO Scores (UserID, GameName, Score) VALUES (?, ?, ?);",
        [UserID, GameName, Score]
      )
      .then(() => {
        res.status(201).json({ message: "Score sucessfully added" });
      })
      .catch((err: QueryError) => {
        if (err.code === "ER_DUP_ENTRY") {
          res.status(409).json({ error: "Duplicate data." });
          return;
        }
        res.status(500).send();
      })
      .catch((err: QueryError) => {
        res.status(500).send();
      });
  });

  // GET /scores - get all scores
  // app.get("/scores", (req: Request, res: Response) => {
  //   connection
  //     .execute("SELECT * FROM Scores")
  //     .then(([results, fields]) => {
  //       res.send(results);
  //     })
  //     .catch((err: QueryError) => {
  //       res.status(500).send();
  //     })
  // });

  // GET /scores/id - get all scores for a user by id
  app.get("/scores", (req: Request, res: Response) => {
    const paramFilter = req.query.filter;
    const paramQuery = req.query.s
    let queryString = ""
    
    switch (paramFilter) {
      case 'UserID':
          queryString = "SELECT * FROM Scores WHERE UserID = ? ORDER BY Score DESC;"
        break;
      case 'Username':
          queryString = "SELECT * FROM Scores INNER JOIN Users ON Scores.UserID = Users.ID WHERE Username LIKE'%?%' ORDER BY Score DESC;"
        break;
        case 'GameName':
          queryString = "SELECT * FROM Scores WHERE GameName = ? ORDER BY Score DESC;"
        break;
      default:
        queryString = "SELECT * FROM Scores INNER JOIN Users ON Scores.UserID = Users.ID;"
        break;
    }

    //Make sure paramFilter and paramQuery are valid

    connection
      .execute(queryString, paramQuery?[paramQuery]: [])
      .then(([results, fields]) => {
        res.send(results);
      })
      .catch((err: QueryError) => {
        res.status(500).send();
      })
  });

  // // DELETE /user/id - delete a user by id
  // app.delete("/users/:id", (req: Request, res: Response) => {
  //   connection
  //     .execute("DELETE from Users where ID = ?;", [req.params.id])
  //     .then(([result]) => {
  //       // ResultSetHeader when DELETE
  //       if ((result as ResultSetHeader).affectedRows != 1) {
  //         res.status(400).json({ error: "User not found." });
  //         return;
  //       }
  //       res.status(200).json({ message: "User sucessfully removed" });
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //       res.status(500);
  //     });
  // });

  // // GET /photos/userId - return all photos for a user
  // app.get("/users/:id/photos", (req: Request, res: Response) => {
  //   connection
  //     .execute("Select * from Photos where userID = ?;", [req.params.id])
  //     .then(([results, fields]) => {
  //       res.send(results);
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //       res.status(500);
  //     });
  // });

  // // GET /photos/id - return photo by id
  // app.get("/photos/:id", (req: Request, res: Response) => {
  //   connection
  //     .execute("Select * from Photos where userID = ? LIMIT 1;", [
  //       req.params.id,
  //     ])
  //     .then(([results, fields]) => {
  //       res.send(results);
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //       res.status(500);
  //     });
  // });

  // // POST /photos - add a photo to photos
  // app.post("/photos/:id", (req: Request, res: Response) => {
  //   const { URL, lat, lng } = req.body;
  //   if (!URL || !lat || !lng) {
  //     res.status(400).json({ error: "Missing required fields." });
  //     return;
  //   }
  //   connection
  //     .query("SELECT * FROM Users WHERE ID = ?;", [req.params.id])
  //     .then(([result]) => {
  //       if ((result as RowDataPacket[]).length != 1) {
  //         res.status(400).json({ error: "User not found." });
  //         return;
  //       }
  //       return connection.execute(
  //         "INSERT INTO Photos (URL, lat, lng, userID) VALUES (?, ?, ?, ?);",
  //         [URL, lat, lng, req.params.id]
  //       );
  //     })
  //     .then(() => {
  //       res.status(200).json({ message: "Photo sucessfully added" });
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //       res.status(500);
  //     });
  // });

  // // DELETE /photos/id - delete a photo by id
  // app.delete("/photos/:id", (req: Request, res: Response) => {
  //   connection
  //     .execute("DELETE from Photos where ID = ?;", [req.params.id])
  //     .then(([result]) => {
  //       // ResultSetHeader when DELETE
  //       if ((result as ResultSetHeader).affectedRows != 1) {
  //         res.status(400).json({ error: "Photo not found." });
  //         return;
  //       }
  //       res.status(200).json({ message: "Photo sucessfully removed" });
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //       res.status(500);
  //     });
  // });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

export { app };
