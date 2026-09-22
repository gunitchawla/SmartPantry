# 🎥 SmartPantry: Screen Recording Guide (< 2 Minutes)
**COSC349 Assignment 2: Redesigning and Deploying Software for the Cloud**

The assignment requires a screen recording of **no more than two minutes (120 seconds)** demonstrating:
1. A user completing a representative workflow through the cloud-hosted application.
2. A meaningful write to and read from the managed storage service (**Amazon DynamoDB**).
3. Cloud-console or command-line evidence of the compute (**EC2**) and managed services (**DynamoDB, SNS, S3**) used by that workflow.

---

## ⏱️ Exact Video Timeline & Narration Script (110 Seconds Total)

| Timestamp | Screen Display | Action to Perform | Spoken Narration Script |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:25** (25s) | Web Browser on `http://<frontend-ip>` | 1. Open the SmartPantry web dashboard.<br>2. Point to the "☁️ AWS Cloud Connected" badge.<br>3. Fill out the **Add to pantry** form with an item nearing expiry:<br>• Name: `Fresh Whole Milk`<br>• Quantity: `2`<br>• Expiry Date: *(Select tomorrow's date)*<br>4. Click **Add to shelf**. | *"Here is the SmartPantry cloud-hosted web interface running on an AWS EC2 instance. I am adding a new item, 'Fresh Whole Milk' with 2 units expiring tomorrow. Clicking 'Add to shelf' triggers a POST request to our backend API."* |
| **0:25 - 0:45** (20s) | Web Browser on `http://<frontend-ip>` | 1. Observe the new item card appear on the shelf tagged with the amber **USE SOON** status pill.<br>2. Filter by clicking the **Expiring soon** chip.<br>3. Click the **Run Expiry & Stock Audit** cloud button. Observe the confirmation banner: *"Audit complete! Amazon SNS alert sent."* | *"The item is immediately saved into Amazon DynamoDB and rendered on our shelf with the 'Use soon' status. Clicking 'Run Expiry & Stock Audit' triggers an automated backend scan that dispatches an alert through Amazon SNS."* |
| **0:45 - 1:10** (25s) | AWS Management Console: **DynamoDB** | 1. Switch to the AWS Console tab open to **DynamoDB > Tables > `smartpantry-inventory` > Explore items**.<br>2. Click **Scan / Refresh**.<br>3. Highlight the newly created item record showing `id`, `name`, `quantity: 2`, and `status: "soon"`. | *"Here in the AWS DynamoDB console under table `smartpantry-inventory`, we refresh the items view. You can see the new item record successfully persisted with its unique UUID, timestamp, and metadata."* |
| **1:10 - 1:35** (25s) | AWS Management Console: **EC2 & SNS** | 1. Switch to the **EC2 Console > Instances** showing `smartpantry-frontend` and `smartpantry-backend` both in `running` state.<br>2. Switch to the **Amazon SNS Console > Topics > `smartpantry-alerts`**.<br>3. (Optional) Show the email inbox with the alert notification received from AWS SNS. | *"In the EC2 Console, we see our two interacting virtual machines: `smartpantry-frontend` serving the web app and `smartpantry-backend` running our REST API. In Amazon SNS, topic `smartpantry-alerts` delivers our expiry and audit notifications."* |
| **1:35 - 1:55** (20s) | Terminal / Command-Line | Run the automated cloud verification script:<br>`./scripts/test-cloud-workflow.sh http://<backend-ip>:5000`<br>Point to all 6 green passing checks. | *"Finally, in the terminal, we execute our automated verification script against the cloud backend. All checks pass, proving reproducible compute, managed storage reads and writes, and SNS alert dispatching. Thank you."* |

---

## 🎬 Recording Preparation Checklist
- [ ] Ensure both EC2 instances (`smartpantry-frontend` and `smartpantry-backend`) are running.
- [ ] Open 4 browser tabs beforehand to switch quickly:
  1. **Tab 1**: SmartPantry Web App (`http://<frontend-public-ip>`)
  2. **Tab 2**: AWS Console -> DynamoDB -> `smartpantry-inventory` -> Explore table items
  3. **Tab 3**: AWS Console -> EC2 Instances list (showing both instances running)
  4. **Tab 4**: AWS Console -> Amazon SNS -> Topics -> `smartpantry-alerts`
- [ ] Have a terminal window open sized nicely to run:
  ```bash
  ./scripts/test-cloud-workflow.sh http://<backend-public-ip>:5000
  ```
- [ ] Test your microphone level and do a quick 30-second practice run.
- [ ] Check recording length: **Must not exceed 120 seconds!**
- [ ] Upload video to University of Otago OneDrive (or unlisted YouTube) and copy the sharing link into `REPORT.md` and the Aoroa submission field.
