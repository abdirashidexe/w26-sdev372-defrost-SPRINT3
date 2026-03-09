# TWILIO Setup Documentation

## 1. Open Twilio website on broswer
[Twilio Home page](https://www.twilio.com/en-us)

## 2. Select "Start for free" and create an account.
Use google or personal preferred. Have every team member create an account to optimize amount of verified numbers.

## 3. Copy and store AccountSID and API Auth Tokens
Navigate to admin dropdown on the top right.

Select "Keys & Credentials" on the sidebar on the elft hand side. Click onto "API keys & tokens".

Store AccountSID and API Auth Token in a private setting. DO NOT ACCIDENTALLY REVEAL AUTH TOKEN TO PUBLIC.

## 4. Copy Twilio virtual phone number
Navigate to home dashboard.

On sidebar, select:

Phone Numbers -> Manage -> Active Numbers

Copy the virtual Twilio number in this format "+1 844 619 4135" (with the leading +1, should be ten digits)

## 5. Add AccountSID, API Auth Tokens, and Twilio Number to .env file

Open .env and insert information accordingly:

```
TWILIO_PHONE_NUMBER={YOUR_TWILIO_VIRTUAL_PHONE_NUMBER}
TWILIO_ACCOUNT_SID={YOUR_ACCOUNT_SID}
TWILIO_AUTH_TOKEN={YOUR_AUTH_TOKEN}
```

## 6. Install Twilio in the backend
cd to backend and run

```npm install twilio```

## 7. Next steps/To Do:

We are yet to verify a personal phone number to send messages too however for testing purposes hardcode a personal number on the backend once verified in the Twilio dashboard and test.

Every account is limited to 5 verified phone numbers (personal numbers) to send to. Not ideal for public use but in theory if paid for API use, can work.

Every free account has $15.50 in credit. With one SMS message costing about $0.0032 to send.

Next steps:

Verify personal number, test in backend with thank you message, create shell for thank you for signing up and defrost alert for backend.


### Testing:
npm i (in backend and frontend)
npm run test 

### Docker
**Prereq:** Docker installed

1. `docker compose build`
2. `docker compose up`
3. `docker compose down`

