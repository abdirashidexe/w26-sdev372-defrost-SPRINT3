import pool from "./db/config.js";
import express from "express";
import cors from "cors";
import twilio from "twilio";
import { Resend } from "resend";
const app = express();
const PORT = process.env.PORT || 3000;

const resend = new Resend('re_QaEfBqaf_BAD5fgzLJJNFfsn6Q8LPyyHu');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

(function enableCors() {
  app.use(cors());
})();

(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("DB connected");
  } catch (err) {
    console.error("DB connection failed");
    console.error(err.message);
  }
})();

app.use(express.json());

app.post("/users", async (req, res) => {
  const phone = cleanPhoneNumber(req.body?.phoneNumber || req.body?.phone_number);

  if (!phone) {
    return res.status(400).json({ error: "Provide a numeric phoneNumber with at least 10 digits" });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO defrost_users (phone_number) VALUES (?)`,
      [phone]
    );
    console.log(`Inserted phone ${phone} (id ${result.insertId ?? "unknown"})`);
    return res.status(201).json({ id: result.insertId, phoneNumber: phone });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Phone number already registered" });
    }
    console.error("saving user failed", err);
    return res.status(500).json({ error: "Unable to save user" });
  }
});

// app.post("/send-text", async (req,res) => {
//   try{
//     const message = await client.messages.create({
//       body: "Defrost detected! Set an earlier alarm for tommorow!",
//       // messagingServiceSid: 'MG445aabc3d69bafeae5a179c6716a3f66',
//       to: '+12533350973',
//       from: '+18556339571'
//       // from: `${twilioNumber}`,
//       // to: `+1${phone}`,
//     });
//     console.log(message);
//     return res.status(200).json({message: message})
//   } catch(err) {
//     console.log(`Uh oh.. error: ${err}`)
//   }
// })


app.post("/send-text", async (req, res) => {
  const data = await resend.emails.send({
    from: 'onboarding@resend.dev', // resend testing email
    to: 'ahmed.abdirashid@student.greenriver.edu', // recipients email (testing w/ dev)
    subject: 'Defrost Alert!',
    html: '<p>Defrost detected! Set an earlier alarm for tomorrow!</p>',
  });

  console.log(data);
  return res.status(200).json({ message: data });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export function cleanPhoneNumber(input) {
  if (typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}