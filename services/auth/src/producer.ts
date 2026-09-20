import { Kafka, Producer, Admin } from "kafkajs";
/*Your Auth Service database successfully saves a new user. Your Node.js code creates a Producer worker.
You hand the Producer worker a sticky note with the user's email address and the target pipe name ("send-mail").
The Producer packs that sticky note into a heavy binary box.
The Producer walks up to the Kafka Docker container, finds the pipe labeled "send-mail", shoves the box inside, and immediately goes home.

The Role: The Admin's only job is to build the pipes, delete the pipes, and check if the building is on fire.
The Flow (Step-by-step):
Before your Auth Service can send a message, and before your Mail Service can listen for a message, the pipe has to physically exist.
You run a setup script that hires an Admin worker.
You tell the Admin: "I need a new pipe named 'send-mail', and I need it to have 3 conveyor belt lanes (partitions)."
The Admin walks into the Docker container, physically builds the pipe, sets up the 3 lanes, and walks out.*/

import dotenv from "dotenv";
dotenv.config();

let producer: Producer;
let admin: Admin;

// connection to kafka 
export const connectKafka = async () => {
  try {
    const kafka = new Kafka({
      clientId: "auth-service",
      brokers: [process.env.Kafka_Broker || "localhost:9092"],
    });
 
    //admin created & connected
    admin = kafka.admin();
    await admin.connect();

    //now i will check if the required topic already exists if it does not exist i w'll create else use the already created one.
    const topics = await admin.listTopics();
    
    if (!topics.includes("send-mail")) {
      await admin.createTopics({
        topics: [
          {
            topic: "send-mail",
            numPartitions: 1,  //i gave partition in consumer  it is that one
            replicationFactor: 1,
            /*The Flow of 1: When the Producer drops a box into the "send-mail" pipe, Kafka saves it to one hard drive. It makes zero backup copies.
The Danger: If that single hard drive crashes, or if you accidentally delete your Docker container, all of your saved emails are permanently destroyed. There is no backup.
Why you are using 1 right now: Because you are coding on your personal laptop. You only have one Docker container running. You physically do not have a second server to send a backup to! Kafka would actually throw an error if you tried to set it to 2 right now.*/
          },
        ],
      });
      console.log("✅ Topic 'send-mail' created");
    }

    await admin.disconnect();

    //creating producer
    producer = kafka.producer();
    // connecting producer just like we connected consumer 
    await producer.connect();

    console.log("✅ connected to kafka producer");
  } catch (error) {
    console.log("Failed to connect to kafka", error);
  }
};

// function to publish message 
export const publishToTopic = async (topic: string, message: any) => {
  if (!producer) {
    console.log("kafka producer is not initialized");
    return;
  }

  try {
    await producer.send({
      topic: topic,
      messages: [
        {
          value: JSON.stringify(message),   // js object converted into json text string 
        },
      ],
    });
  } catch (error) {
    console.log("Failed to publish message to kafka", error);
  }
};

// funnction to disconnect kafka for gracefull shutdown
export const disconnectKafka = async () => {
  if (producer) {
    producer.disconnect();
  }
};
