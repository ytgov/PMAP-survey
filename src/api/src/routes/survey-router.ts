import express, { Request, Response } from "express";
import { db } from "../data";
import { ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";

export const surveyRouter = express.Router();

surveyRouter.get("/:token", [param("token").notEmpty()], ReturnValidationErrors,
    async (req: Request, res: Response) => {
        let { token } = req.params;

        let p = db("SRVT.PARTICIPANT")
            .join("SRVT.PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
            .where({ "PARTICIPANT.TOKEN": token }).whereNotNull("EMAIL").first()

        let participant = await db("SRVT.PARTICIPANT")
            .join("SRVT.PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
            .where({ "PARTICIPANT.TOKEN": token }).whereNotNull("EMAIL")
            .select("PARTICIPANT.*").first()
            .then(r => r)
            .catch(err => {
                console.log("DATABASE CONNECTION ERROR", err);
                res.status(500).send(err);
            });

        if (participant) {
            let survey = await db("SRVT.SURVEY").where({ SID: participant.SID }).first();
            let questions = await db("SRVT.QUESTION").where({ SID: participant.SID }).orderBy("ORD");

            return res.json({ data: { survey, questions } });
        }

        res.status(404).send();
    });

surveyRouter.get("/:token/preview", [param("token").notEmpty()], ReturnValidationErrors,
    async (req: Request, res: Response) => {
        let { token } = req.params;

        let survey = await db("SRVT.SURVEY").where({ SID: token }).first();

        if (survey) {
            let questions = await db("SRVT.QUESTION").where({ SID: token }).orderBy("ORD");
            return res.json({ data: { survey, questions } });
        }
        res.status(404).send();
    });

surveyRouter.post("/:token", [param("token").notEmpty()], ReturnValidationErrors,
    async (req: Request, res: Response) => {
        let { token } = req.params;
        let { questions } = req.body;
        let participant = await db("SRVT.PARTICIPANT")
            .join("SRVT.PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
            .where({ "PARTICIPANT.TOKEN": token }).whereNotNull("EMAIL")
            .select("PARTICIPANT.*").first();

        if (participant) {
            for (let question of questions) {
                let id = question.QID;
                let answer = question.answer;
                let answer_text = question.answer_text

                let ans: any = {
                    TOKEN: token,
                    QID: id
                };

                if (typeof answer == "number")
                    ans.NVALUE = answer;
                else if (Array.isArray(answer))
                    ans.TVALUE = JSON.stringify(answer);
                else
                    ans.TVALUE = answer;

                if (answer_text && answer_text.length > 0) {
                    ans.TVALUE = answer_text;
                }

                await db("SRVT.RESPONSE_LINE").insert(ans);
            }

            await db("SRVT.PARTICIPANT_DATA").where({ "TOKEN": token }).update({ "EMAIL": null, "RESPONSE_DATE": new Date() });

            return res.json({ data: {}, messages: [{ variant: "success" }] });
        }

        res.status(404).send();
    });

// This route is only temporary to test for submissions
surveyRouter.get("/:token/answers", [param("token").notEmpty()], ReturnValidationErrors,
    async (req: Request, res: Response) => {
        let { token } = req.params;
        let answers = await db("SRVT.RESPONSE_LINE").where({ TOKEN: token })
        return res.json({ data: answers });
    });
