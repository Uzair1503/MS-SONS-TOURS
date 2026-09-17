import { Kafka, Producer } from "kafkajs";
import { config } from "./index";

let kafka: Kafka | null = null;
let producer: Producer | null = null;

function getKafka(): Kafka | null {
  if (!kafka) {
    try {
      kafka = new Kafka({
        clientId: "ms-sons-tours",
        brokers: config.kafkaBrokers,
        retry: { initialRetryTime: 100, retries: 3 },
      });
    } catch {
      console.warn("Kafka not available - events will be processed synchronously");
      return null;
    }
  }
  return kafka;
}

export async function getProducer(): Promise<Producer | null> {
  const k = getKafka();
  if (!k) return null;
  if (!producer) {
    producer = k.producer();
    try {
      await producer.connect();
    } catch {
      console.warn("Kafka producer connection failed");
      producer = null;
      return null;
    }
  }
  return producer;
}

export async function publishEvent(topic: string, message: Record<string, unknown>): Promise<void> {
  const p = await getProducer();
  if (!p) {
    console.log(`[Kafka unavailable] Event: ${topic}`, JSON.stringify(message).slice(0, 200));
    return;
  }
  try {
    await p.send({
      topic,
      messages: [{ value: JSON.stringify({ ...message, timestamp: new Date().toISOString() }) }],
    });
  } catch (err) {
    console.error(`Failed to publish event to ${topic}:`, err);
  }
}

export async function closeKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
  kafka = null;
}