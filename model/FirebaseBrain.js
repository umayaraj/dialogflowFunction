const admin = require('firebase-admin');
admin.initializeApp();

//Goal CURD
async function saveGoal(uid, data) {
    try {
        return await admin.firestore().collection('Data').doc(uid).collection('Goal').add(data).then((DocumentReference) => {
            return DocumentReference.id;
        });
    } catch (e) {
        return e;
    }
}
async function updateGoal(uid, docId, data) {
    try {
        let DocumentReference = await admin.firestore().collection('Data').doc(uid).collection('Goal').doc(docId).update({ ...data });
        return DocumentReference;
    } catch (e) {
        return e
    }
}
async function readGoal(uid) {
    var snapshot = await admin.firestore().collection('Data').doc(uid).collection('Goal').get();
    let goalList = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        goalList.push({ id, ...data });
    });
    return goalList;
}
async function readSingleGoal(uid, docId) {
    var snapshot = await admin.firestore().collection('Data').doc(uid).collection('Goal').doc(docId).get();
    let user = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        user.push({ id, ...data });
    });
    return user;
}
async function deleteGoal(uid, docId) {
    try {
        let DocumentReference = await admin.firestore().collection('Data').doc(uid).collection('Goal').doc(docId).delete();
        return DocumentReference;
    } catch (e) {
        return e
    }
}
//Task CURD
async function saveTask(uid, selectedGoal, data) {
    try {
        return await admin.firestore().collection('Data').doc(uid).collection('Goal').doc(selectedGoal).collection('Task').add(data).then((DocumentReference) => {
            return DocumentReference;
        });
    } catch (e) {
        return e
    }
}
async function updateTask(uid, goalId, taskId, data) {
    try {
        let DocumentReference = admin.firestore().collection('Data').doc(uid).collection('Goal').doc(goalId).collection('Task').doc(taskId).update({ ...data });
        return DocumentReference;
    } catch (e) {
        return e
    }
}
async function readTask(uid) {
    let goalDocRef = await admin.firestore().collection('Data').doc(uid).collection('Goal').get();
    let taskList = [];
    goalDocRef.forEach(async (goal) => {
        let taskDocRef = await admin.firestore().collection('Data').doc(uid).collection('Goal').doc(goal.id).collection('Task').get();
        taskDocRef.forEach((task) => {
            taskList.push({ id: task.id, ...task.data() });
        });
        console.log(`Log1:${JSON.stringify(taskList)}`);
    });
    console.log(`Log2:${JSON.stringify(taskList)}`);
    return taskList;

// DataArray1 = [];
// goalRef.child(UID).on("value", (snap) => {
//     snap.forEach(goalsnap => {
//         taskRef.child(goalsnap.key).once("value").then(tasksnap => {
//             tasksnap.forEach(snap => {
//                 let childData = snap.val();
//                 DataArray1.push(childData);
//             });
//         });
//     });
// });
// console.log('Read All Task Completeed');

}
async function readSingleGoalTask(uid, docId) {
    var taskDocRef = await admin.firestore().collection('Data').doc(uid).collection('Goal').doc(docId).collection('Task').get();
    let taskList = [];
    taskDocRef.forEach(task => {
        taskList.push({ id: task.id, ...task.data() });
    });
    return taskList;
}
async function deleteTask(uid, goalId, taskId) {
    try {
        let DocumentReference = admin.firestore().collection('Data').doc(uid).collection('Goal').doc(goalId).collection('Task').doc(taskId).delete();
        return DocumentReference;
    } catch (e) {
        return e
    }
}
//user
async function Updateuser(uid, name) {
    let userData = {
        displayName: name,
    };
    await admin.auth().updateUser(uid, userData)
        .then(userRecord => { return userRecord })
        .catch((error) => { return error });
}
async function readUser(uid) {
    return await admin.auth().getUser(uid)
        .then((userRecord) => { return userRecord })
        .catch((error) => {
            console.log('Error fetching user data:', error);
            return error;
        });
}

module.exports = {
    //Goal
    saveGoal: saveGoal,
    updateGoal: updateGoal,
    readGoal: readGoal,
    deleteGoal: deleteGoal,
    //Task
    saveTask: saveTask,
    updateTask: updateTask,
    readTask: readTask,
    readSingleGoalTask: readSingleGoalTask,
    deleteTask: deleteTask,
    //User
    readUser: readUser,
    Updateuser: Updateuser
}
