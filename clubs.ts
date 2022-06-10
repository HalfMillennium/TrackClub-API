const mongoCollections = require('./mongoCollections');
const clubs = mongoCollections.clubs;
const {ObjectId} = require('mongodb');

let exportedMethods = {
  async getClubById(id) {
    if (!id) throw 'You must provide a club ID';
    if (typeof id !== 'string') throw 'ID must be a string';
    if (id.trim().length === 0)
      throw 'ID cannot be an empty string';
    id = id.trim();
    if (!ObjectId.isValid(id)) throw 'invalid object ID';

    const clubCollection = await clubs();
    const club = await clubCollection.findOne({_id: ObjectId(id)});
    if (!club) throw 'No club with that ID';

    return club;
  },
  async getAllClubs() {
    const clubCollection = await clubs();
    const clubList = await clubCollection.find({}).toArray();
    if (!clubList) throw 'Could not get all clubs';
    return clubList;
  },
  async addClub(title, desc, creator, general) {
    if (!title) throw 'You must provide a title';
    if (typeof title !== 'string') throw 'Title must be a string';
    if (title.trim().length === 0)
      throw 'Title cannot be an empty string or just spaces';
    if (!desc) throw 'You must provide a body';
    if (typeof desc !== 'string') throw 'Body must be a string ';
    if (desc.trim().length === 0)
      throw 'Body cannot be an empty string or just spaces';
    if (!creator) throw 'You must specify a poster';
    if (typeof creator !== 'string') throw 'posterId must be a string';
    if (creator.trim().length === 0)
      throw 'PosterId cannot be an empty string or just spaces';
    if (!ObjectId.isValid(creator)) throw 'posterId is not a valid Object ID';
    title = title.trim();
    desc = desc.trim();
    creator = creator.trim();

    const clubCollection = await clubs();
    const newClubInfo = {
      title: title,
      desc: desc,
      creator: {
        id: creator
      },
      color: general.color,
      platform: "Spotify",  // all clubs are Spotify based... for now ;)
      est: Date.now(),
      chosen_genres: ["Funk", "Psychadelia", "R&B", "Pop"],
      current_tm_radio: []   // tm => track_master
    };

    const insertInfo = await clubCollection.insertOne(newClubInfo);
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
      throw 'Could not add club';

    const newClub = await this.getClubById(insertInfo.insertedId.toString());

    return newClub;
  },
  // Maybe instead just pass current Club fields/attributes instead of only passing the ID? Save a call maybe

  async updateClubRadio(command, set_list, club_ID) {   // set_list should never be malformed
    const clubCollection = await clubs();
    const club = await clubCollection.getClubById(club_ID);

    // command: 0 ==> initialize club radio, command: 1 ==> just update it
    let updated_radio = []
    if(!command) {
        // Set creation time and 'last modified' time
        updated_radio = [Date.now(),Date.now(),set_list]
    } else {
        // Only change 'last modified' time
        updated_radio = [club.current_tm_radio[0],Date.now(),club.current_tm_radio[2]]
    }

    let updatedClub = {
      title: club.title,
      desc: club.desc,
      creator: {
        id: club.creator
      },
      color: club.color,
      platform: club.platform,
      est: club.est,
      chosen_genres: club.chosen_genres,
      current_tm_radio: updated_radio
    };

    const updatedInfo = await clubCollection.replaceOne(
      {_id: ObjectId(club_ID)},
      updatedClub
    );

    if (updatedInfo.modifiedCount === 0) {
      throw 'could not update club radio successfully';
    }

    return await this.getClubById(club_ID);
  }
};

module.exports = exportedMethods;