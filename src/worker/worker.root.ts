import { WorkerDriver } from "./worker.driver";
import "./worker.http";

const w = self as unknown as SharedWorkerGlobalScope;

(() => new WorkerDriver(w))();
