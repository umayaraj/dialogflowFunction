
const admin = require('firebase-admin');
// const { auth } = require('firebase-admin');
admin.initializeApp();

async function readGoal(uid) {
    var snapshot = await admin.firestore().collection('Data').doc(uid).collection('Goal').get();
    let user = [];
    snapshot.forEach(element => {
        let id = element.id;
        let data = element.data();
        user.push({ id, ...data });
    });
    return user;
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
async function saveGoal(uid, data) {
    try {
        let DocumentReference = admin.firestore().collection('Data').doc(uid).collection('Goal').add(data);
        return DocumentReference;
    } catch (e) {
        return e
    }
}
async function updateGoal(uid, docId, data) {
    try {
        let DocumentReference = admin.firestore().collection('Data').doc(uid).collection('Goal').doc(docId).update({ ...data });
        return DocumentReference;
    } catch (e) {
        return e
    }
}
async function deleteGoal(uid, docId) {
    try {
        let DocumentReference = admin.firestore().collection('Data').doc(uid).collection('Goal').doc(docId).delete();
        return DocumentReference;
    } catch (e) {
        return e
    }
}

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
    readGoal: readGoal,
    saveGoal: saveGoal,
    updateGoal: updateGoal,
    deleteGoal: deleteGoal,
    Updateuser: Updateuser,
    readUser: readUser
}


// function createToken(uid) {
//     return admin.auth().createCustomToken(uid).then(function (customToken) {
//         return customToken;
//     }).catch(function (error) {
//         console.log('Error creating custom token:', error);
//         return error;
//     });
// }