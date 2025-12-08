// import {multiTasker} from "./multi-tasker.js";
//
//
// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// const run = async () => {
//
// 	const mt = multiTasker({
// 		title: 'sasd',
// 	})
// 	//console.log(t1.getBuffer());
// 	const g1 = mt.addGroup('pepe');
// 	const g2 = mt.addGroup('pepe2');
// 	const t1g1 = g1.addTask('task1 de group 1')
// 	const t1g2 = g2.addTask('task1 de group 2')
//
//
// 	t1g1.message('g1 t1 asdasdasd 1')
// 	await sleep(200);
// 	t1g1.message('g1 t1 asdasd 2222')
// 	await sleep(200);
// 	t1g2.message('g2 t2 asdasd 2222 t1 g2')
// 	await sleep(200);
// 	t1g2.message('g2 t1 asdasd 2222 t1 g2')
// 	t1g1.message('g1 t1 asdasd 3 t1 g1')
// 	await sleep(200);
// 	t1g2.message('g2 t1 asdasd 2222 t1 g2')
// 	t1g1.message('g1 t1 asdasd 4 y las t1 g1')
//
//
// 	//t1g1.limpiar();
// 	await sleep(2000);
// 	await Promise.all([
// 		tasKprogress(g1),
// 		task2Pro(g2)
// 	])
// 	mt.success('asa22')
// }
// const task2Pro = async (g1) => {
// 	const t2g1 = g1.addTask('task2 de group 2')
// 	t2g1.message('g2 t2 1 asdasdasd t2g1')
// 	await sleep(1000);
// 	t2g1.message('g2 t2 2 asdasdasd t2g1')
// 	await sleep(1000);
// 	t2g1.message('g2 t2 3 asdasd 1111 t2g1')
// 	await sleep(1000);
// 	t2g1.message('g2 t2 4 asdasd 333 t2g1')
//
// 	await sleep(1000);
// 	t2g1.message('g2 t2 5 y last asdasd 444 t2g1')
//
// 	await sleep(3000);
// }
//
// const tasKprogress = async (g1) => {
// 	const t2g1 = g1.addProgress('task3 de group 1 progress')
// 	t2g1.start('holaaa spinner');
// 	await sleep(2000);
// 	t2g1.message('g1 t2 1 asdasdasd t2g1')
// 	await sleep(2000);
// 	t2g1.message('g1 t2 2 asdasdasd t2g1')
// 	await sleep(2000);
// 	t2g1.message('g1 t2 3 asdasd 1111 t2g1')
// 	await sleep(2000);
// 	t2g1.message('g1 t2 4 asdasd 333 t2g1')
//
// 	await sleep(2000);
// 	t2g1.message('g1 t2 5 y last asdasd 444 t2g1')
//
// 	await sleep(6000);
// 	t2g1.stop('holaaa spinner success');
// }
//
// run()
