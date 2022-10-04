declare module "*?sharedworker&inline" {
	const WorkerFactory: new () => SharedWorker;
	export default WorkerFactory;
}
