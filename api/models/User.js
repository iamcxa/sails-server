module.exports = {
  attributes: {

    // id: {
    //   type: Sequelize.UUID,
    //   defaultValue: () => sails.config.models.genShortUuid(),
    //   primaryKey: true,
    // },

    // index: {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    //   unique: true,
    //   autoIncrement: true,
    // },

    weights: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: true,
    },

    locales: {
      type: Sequelize.STRING(127),
      allowNull: true,
    },

    username: {
      type: Sequelize.STRING(512),
      allowNull: false,
      unique: true,
    },

    email: {
      type: Sequelize.STRING(127),
      allowNull: true,
      unique: true,
    },

    userAgent: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    lastLogin: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    lastLoginIP: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },

    isConfirm: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    },

    confirmedDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    expirationDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    verifyEmailToken: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    resetPwdToken: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
  },
  associations() {},
  options: {
    paranoid: true,
    timestamps: true,
    classMethods: {
      ...sails.config.models.classMethod.User,
      associations() {
        return {
          belongsTo: [],
          hasMany: [],
          hasOne: [],
          belongsToMany: [],
        };
      },
    },
    instanceMethods: {
      ...sails.config.models.instanceMethod.User,
    },
    hooks: {
      ...sails.config.models.hook.User,
    },
  },
};
