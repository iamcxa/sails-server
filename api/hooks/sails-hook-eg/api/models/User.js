module.exports = {
  attributes: {

    index: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  },
  associations() {},
  options: {
    // paranoid: true,
    // timestamps: true,
    // classMethods: {
    //   ...sails.config.models.classMethod.User,
    // },
    // instanceMethods: {
    //   ...sails.config.models.instanceMethod.User,
    // },
    // hooks: {
    //   ...sails.config.models.hook.User,
    // },
  },
};
