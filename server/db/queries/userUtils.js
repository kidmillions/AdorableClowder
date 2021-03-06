var db = require('../config.js');
var Promise = require('bluebird');
var _ = require('underscore');
var Models = require('../models.js');
var User = Models.User;
var Offer = Models.Offer;
var Want = Models.Want;


// attachSkillsToUser is a promise that takes a Bookshelf User model, an array of skills (as strings),
// and the corresponding table the skills belong to (eg: 'offers' or 'wants') and creates the Bookstrap version
// of a join table between the user and the skills on that table
// NOTE: Bookshelf creates a new user model and updates the relations when .attach is called.
// Since this is the case attachSkillsToUser must chain sequentially
module.exports = {
   attachSkillsToUser: function (user, skills, table) {
    return new Promise(function (resolve, reject) {
      module.exports.getAllSkillIds(skills, module.exports.convertToModelName(table)).then(function (ids) {
        // attaches an array of ids from from the table passed into the 'related' method
        user.related(table).attach(ids).then(function (relation) {
          resolve(user);
        });
      });
    });
  },
  /* same as attachSkillsToUser except detaching the skills, for when the user updates
  their profile.
  */
  detachSkillsFromUser: function (user, table) {
    return new Promise(function (resolve, reject){
      user.related(table).detach().then(function (relation){
        resolve(user);
      });
    });
  },
  /*
  getAllSkillIds is a promise that accepts an array of skill strings and a string representing a
  Bookshelf skill type model, and adds them to the db if not already there. an array of id's
  associated with the corresponding skill are passed to the resolve function for .then chaining

  ex: getAllSkillIds(['skyrim', 'yoga', 'surfing'], 'Want').then(function (ids) {
    console.log(ids);
  }) => [4, 12, 6]
  */
  getAllSkillIds: function (skills, skillType) {
    return Promise.all(skills.map(function (item) {
      return module.exports.getSkillId(item.skill, skillType, item.category);
    }));
  },
  // getSkillId is a promise that accepts a raw skill string (eg: 'cooking') and a string representing a Bookshelf class
  // and gets the skill's id from the table based on skill type. the found is then passed through the resolve function
  // NOTE: if the skill is not already in the db, getSkillId will add it to the db before resolving
  getSkillId: function (skill, skillType, category) {
    return new Promise(function (resolve, reject) {
      // convert 'skillType' to the actual Bookshelf class
      var Model = Models[skillType];

      Model.forge({
        skill: skill
      }).fetch().then(function (skillExists) {
        if (skillExists) {
          resolve(skillExists.get('id'));
          return;
        }
        Model.forge({
          skill: skill,
          category: category
        }).save().then(function (savedSkill) {
          console.log(
            savedSkill.get('skill'),
            'saved successfully in ' + skillType + 's table',
            'with a category of ' + savedSkill.get('category'),
            'with an id of:', savedSkill.get('id')
          );
          resolve(savedSkill.get('id'));
        });
      });
    });
  },
  // useful when distinguishing between the MySQL table name VS. the Bookshelf model name
  convertToModelName: function (tableName) {
    return tableName.charAt(0).toUpperCase() + tableName.slice(1, tableName.length - 1);
  }
};
