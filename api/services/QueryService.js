/**
 * @module QueryService
 * @author Kent Chen<iamcxa@gmail.com>
*/
/* eslint no-underscore-dangle: 0 */
// import moment from 'moment';
import _ from 'lodash';
import moment from 'moment-timezone';

const getDate = (date, format) => {
  if (!format) {
    // eslint-disable-next-line no-param-reassign
    format = 'YYYY-MM-DD';
  }
  return (date
    ? moment(date)
      .tz('Asia/Taipei')
      .format(format) : null);
};
const isDate = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g;
const isNumeric = val => (!isNaN(parseFloat(val)) && isFinite(val));


module.exports = {
  /**
   * 定義共通資料欄位，用來將 Model Name 去除，以便使用同一組 i18n。
   * @example model.User.createdAt ==> model.createdAt
   * @param {*} name
   */
  isCommonField(name) {
    try {
      return ['createdAt', 'updatedAt', 'deletedAt', 'id', 'isValid', 'index', 'isActive']
        .some(e => name.indexOf(e) !== -1);
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 依據輸入的 format 物件來格式化輸出，將 data 與 format 合併並保留 format 作為預設值。
   * @version 20180310
   * @example
   * QueryService.matchFormat({
   *    format: {
   *      updatedAt: '',
   *      createdAt: '',
   *      id: '',
   *      type: '',
   *      title: {
   *        'zh-TW': '',
   *        en: '',
   *      },
   *    },
   *    data,
   * });
   * // {
   * //  updatedAt: '03/29/2018',
   * //  createdAt: '03/29/2018',
   * //  id: 5,
   * //  type: 'ceu',
   * //  title: {
   * //    'zh-TW': '測試測試測試測試',
   * //    en: 'Test Test Test'
   * //  },
   * // }
   * @param Required {Object} {
   *     format{Object} = null,  預先定義的資料格式。
   *     data{Object} = null,    尚未處理過的輸入資料。
   *   }
   * @returns formated data
   * @see {@link https://lodash.com/docs/4.17.5#findKey}
   * @see {@link https://lodash.com/docs/4.17.5#hasIn}
   * @see {@link https://lodash.com/docs/4.17.5#has}
   */
  matchFormat({
    format = null,
    data = null,
  }) {
    try {
      const body = Object.assign({}, format);
      // eslint-disable-next-line guard-for-in
      for (const prop in format) {
        if (typeof data[prop] !== 'undefined' && data[prop] !== null) {
          if (_.has(data, prop)) {
            body[prop] = data[prop];
          } else if (_.hasIn(data, prop)) {
            body[prop] = data[_.findKey(data, prop)][prop];
          }
        }
      }
      return body;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 依據定義好的欄位比對並同步輸入與目標物件。
   * @version 1.0
   * @param Required {Object} {
   *     modelName{String} = null,  目標 Sequelize Model 名稱。
   *     format{Object} = null,     預先定義的資料格式。
   *     formatCb{Function} = null, 最後輸出前再次格式化資料的 callback。
   *     rawData{Object} = null,    尚未處理過的輸入資料。
   *     source{Object} = null,     要被填入的空白資料欄位。
   *   }
   * @example
   * QueryService.formatInput({
   *    modelName,
   *    format,
   *    formatCb,
   *    source: QueryService.buildEmptyModel({
   *       modelName,
   *    }),
   *    rawData: input,
   * });
   * @returns {Object} 格式化過的輸入資料。
   * @see {@link https://lodash.com/docs/4.17.5#hasIn}
   * @see {@link https://lodash.com/docs/4.17.5#has}
   * @see {@link https://lodash.com/docs/4.17.5#set}
   */
  formatInput({
    // eslint-disable-next-line no-unused-vars
    modelName = null,
    format = null,
    source = null,
    rawData = null,
    formatCb = null,
  }) {
    try {
      // 比對來源與目的物件是否有以下欄位
      if (format) {
        for (const path of format) {
          // console.log('path=>', path);
          if (_.hasIn(rawData, path)) {
            // console.log('_.get(rawData, path)=>', _.get(rawData, path));
            const value = _.get(rawData, path);
            if (_.isNil(value) || (!isNumeric(value) && _.isEmpty(value))) {
              _.set(source, path, null);
            } else if (_.isString(value)
              && value.match(isDate) !== null) {
              // 檢查輸入是否包含日期
              _.set(source, path, new Date(value));
            } else if (value === 'Invalid date') {
              _.set(source, path, null);
            } else {
              _.set(source, path, value);
            }
          }
        }
      }
      const hasCb = (!_.isNil(formatCb) && _.isFunction(formatCb));
      return hasCb ? formatCb(source) : source;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 格式化來自 Sequelize Query 的輸出物件，並視輸入來輸出該 Model 的欄位定義給前端。
   * 如果有給予 fields，可以依據 required 與 readonly 參數，給予前端可以自動產生表格的資料。
   * @version 1.0
   * @param Required {Object} {
   *     format{Object} = null,     預先定義的資料格式。
   *     formatCb{Function} = null, 最後輸出前再次格式化資料的 callback。
   *     data{Object} = null,       來自 Sequelize Query 後的原始的輸出資料。
   *     fields{Object} = null,     預先定義的 Sequelize Model 欄位定義。
   *     required{Array} = [],     要被設定為 required 的欄位名稱。
   *     readonly{Array} = [],     要被設定為 readonly 的欄位名稱。
   *  }
   * @example
   * QueryService.formatOutput({
   *    format,
   *    formatCb,
   *    fields,
   *    required,
   *    readonly,
   *    data: data.toJSON(),
   *  });
   * @returns {Object} 格式化過的輸出資料與 Sequelize Model 欄位定義。
   */
  formatOutput({
    format = null,
    formatCb = null,
    data = null,
    fields = null,
    required = [],
    readonly = [],
    extra = null,
  }) {
    let result = {};
    try {
      // 格式化輸出
      if (format) {
        // 比對來源與目的物件是否有以下欄位
        for (const path of format) {
          if (_.hasIn(data, path)) {
            const value = _.get(data, path);
            if (_.isEmpty(value)) {
              _.set(result, path, null);
              // 檢查輸入是否包含日期
            } else if (value.match(isDate) !== null) {
              _.set(result, path, new Date(value));
            } else {
              _.set(result, path, value);
            }
          }
        }
      } else {
        result = data;
      }
      // 檢查並輸出前端要顯示的欄位與類型
      if (fields) {
        // eslint-disable-next-line no-underscore-dangle
        result._fields = fields.map((field) => {
          // 如果已經有 required 與 readonly 欄位則不修改
          if (_.has(field, 'required') && _.has(field, 'readonly')) {
            return field;
          }
          return ({
            ...field,
            required: required
              ? required.some(r => r === field) : false,
            readonly: readonly
              ? readonly.some(r => r === field) : false,
          });
        });
      }
      if (extra) {
        result = {
          ...result,
          ...extra,
        };
      }
      return (!_.isNil(formatCb) && _.isFunction(formatCb))
        ? formatCb(result) : result;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 依據給予的資料建立
   * @version 1.0
   * @param Required {Object} {
   *     langCode{String} = 'zh-TW',   要新增的資料語系。
   *     modelName{String} = null,     要新增的目標 Sequelize Model 名稱。
   *     include{Object|Array} = null, 額外給予的 Sequelize include Query。
   *     input{Object} = null,         要新增的原始資料。
   *   }
   * @param Optional {Object} {
   *     format{Object} = null,        原始資料的格式化樣板。
   *     formatCb{Object} = null,      原始資料的格式化 callback。
   *   }
   * @example 依據 input 建立一筆 User 的新資料，並且包含建立 Parent 與 Passport，同時附有建立資料前的 formatCb。
   * QueryService.create({
   *    modelName: 'User',
   *    include: [Parent, Passport],
   *    input: rawData,
   *  }, {
   *    format,
   *    formatCb: e => ({
   *      ...e,
   *     username: rawData.Parent.idNumber,
   *    }),
   * });
   * @returns {Object} created item
   */
  async create({
    langCode = 'zh-TW',
    modelName = null,
    include = null,
    input = null,
  } = {}, {
    format = null,
    formatCb = null,
    toJSON = null,
  } = {}) {
    try {
      const inputHasNull = ValidatorHelper.checkNull([
        modelName,
        input,
      ]);
      if (inputHasNull) {
        throw Error(KEY.BAD_REQUEST.NO_REQUIRED_PARAMETER(inputHasNull));
      }
      const model = sails.models[modelName.toLowerCase()];
      if (!model) {
        throw Error(KEY.BAD_REQUEST.MODEL_NOT_EXISTS(model));
      }
      if (langCode) {
        // TODO: 語系篩選
      }
      console.log('modelName=>', modelName);
      console.log('include=>', include);
      console.log('input==============>');
      console.dir(input);
      // console.log('source==============>');
      // console.dir(this.buildEmptyModel({
      //   modelName,
      // }));
      if (!format) {
        // eslint-disable-next-line
        format = this.getModelColumns({
          modelName,
          // modelPrefix: !_.isEmpty(include),
          modelPrefix: false,
          excludes: ['id', 'createdAt', 'updatedAt'],
          includes: [],
        });
        console.log('format==============>');
        console.dir(format);
      }
      const data = this.formatInput({
        modelName,
        format,
        formatCb,
        source: this.buildEmptyModel({
          modelName,
          // 排除 updatedAt，因為附屬資料不需要
          excludes: ['id', 'createdAt', 'updatedAt'],
        }),
        rawData: input,
      });
      console.log('data==============>');
      console.dir(data);
      // const cretaeBuild = await model.build(data, { include });
      // console.log('build==============>');
      // console.dir(cretaeBuild);
      // const errors = await cretaeBuild.validate().catch((e) => {
      //   console.log("!!!!!!catch");
      //   console.log(e);
      //   throw e;
      // });
      // console.log(errors);
      // return await cretaeBuild.save();
      const createdItem = await model.create(data, {
        include: !_.isEmpty(include) ? include : null,
      });
      if (!createdItem) {
        throw Error('QueryService.Create.Failed.Null.Created.Item');
      }
      return toJSON ? createdItem.toJSON() : createdItem;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 依據給予的 ID 與資料更新 target modelName
   * @version 1.0
   * @param Required {Object} {
   *     langCode{String} = 'zh-TW',   要更新的資料語系。
   *     modelName{String} = null,     要更新的目標 Sequelize Model 名稱。
   *     include{Object|Array} = null, 額外給予的 Sequelize Query-include 參數。
   *     input{Object} = null,         要新增的原始資料。
   *     where{Object} = null,         更新時的 Sequelize Query-where 查詢。
   *   }
   * @param Optional {Object} {
   *     format{Object} = null,        原始資料的格式化樣板。
   *     formatCb{Object} = null,      原始資料的格式化 callback。
   *     updateCb{Object} = null,      資料更新完成後，輸出之前的 callback（支援 await）。
   *   }
   * @example 依據 User ID 更新 User，並且更新連帶的 Parent 與 Student，同時有給予一組輸入格式 format。
   * QueryService.update({
   *    modelName: 'User',
   *    include: [Passport, {
   *      model: Parent,
   *      include: [{
   *        model: Student,
   *        through: 'StudentParent',
   *      }],
   *    }],
   *    where: { id },
   *    input: inputData,
   *  }, {
   *    format,
   *    formatCb: null,
   *  });
   * @returns {Object} updated item
   */
  async update({
    langCode = 'zh-TW',
    modelName = null,
    include = null,
    input = null,
    where = null,
  } = {}, {
    format = null,
    formatCb = null,
    updateCb = null,
  } = {}) {
    try {
      const inputHasNull = ValidatorHelper.checkNull([
        modelName,
        input,
        where,
      ]);
      if (inputHasNull) {
        throw Error(KEY.BAD_REQUEST.NO_REQUIRED_PARAMETER(inputHasNull));
      }
      console.log('update modelName=>', modelName);
      const model = sails.models[modelName.toLowerCase()];
      if (!model) {
        throw Error(KEY.BAD_REQUEST.MODEL_NOT_EXISTS(model));
      }
      if (langCode) {
        // TODO: 語系篩選
      }
      console.log('input==============>');
      console.log('modelName=>', modelName);
      console.dir(input);
      const query = {
        where,
      };
      if (include) {
        query.include = include;
      }
      let target = await model.findOne(query);
      if (!target) {
        throw Error(KEY.ERROR.NO_TARGET_FOUNDED);
      }
      if (!format) {
        // eslint-disable-next-line
        format = this.getModelColumns({
          modelName,
          modelPrefix: false,
          excludes: ['id', 'createdAt', 'updatedAt'],
          includes: include ? include.map(inc => this.getModelColumns({
            modelName: _.isString(inc) ? inc : inc.name,
            modelPrefix: true,
            excludes: ['id', 'createdAt', 'updatedAt'],
          })) : null,
        });
        console.log('format==============>');
        console.dir(format);
      }
      target = this.formatInput({
        modelName,
        format,
        formatCb,
        source: target,
        rawData: input,
      });
      console.log('data==============>');
      console.dir(target);
      const structure = target.toJSON();
      // console.log('structure=>', structure);
      const updateIncludeObject = [];
      Object.keys(structure).forEach((item) => {
        if (_.isObject(structure[item]) && target[item].save) {
          updateIncludeObject.push(target[item].save());
        }
      });
      let result = await Promise.all(updateIncludeObject) && await target.save();
      if (!_.isNil(updateCb) && _.isFunction(updateCb)) {
        result = await updateCb(result);
      }
      return result;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 依據給予的 id array 刪除對象
   * @version 1.0
   * @param Required {Object} {
   *    modelName{String} = null,  要刪除的目標 Sequelize Model 名稱。
   *    ids{Array} = [],           要刪除的欄位 ID 陣列。
   * }
   * @example 刪除 User 表中，ID 為 1~4 的資料。
   * QueryService.destroy({
   *    modelName: 'User',
   *    ids: [1, 2, 3, 4],
   * });
   * // [1, 1, 1, 0]
   * @returns {Array} 包含是否完成的陣列
   */
  async destroy({
    modelName = null,
    include = null,
    force = false,
    ids = [],
  }) {
    try {
      const inputHasNull = ValidatorHelper.checkNull([
        modelName,
        ids,
      ]);
      if (inputHasNull) {
        throw Error(KEY.BAD_REQUEST.NO_REQUIRED_PARAMETER(inputHasNull));
      }
      if (!_.isArray(ids)) {
        throw Error(KEY.BAD_REQUEST.CHECK_INPUT_PARAMETER_TYPE('ids', Array));
      }
      const model = sails.models[modelName.toLowerCase()];
      if (!model) {
        throw Error(KEY.BAD_REQUEST.MODEL_NOT_EXISTS(model));
      }
      const results = [];
      /* eslint no-await-in-loop: 0 */
      for (const id of ids) {
        // delete associated model item with giving model id.
        if (include) {
          for (const includeModel of include) {
            let includeModelName;

            if (includeModel.model) {
              includeModelName = includeModel.model.name;
            } else if (includeModel.modelName) {
              includeModelName = includeModel.modelName;
            } else if (includeModel.name) {
              includeModelName = includeModel.name;
            }

            const target = await model.findById(id);
            const associatedId = target[`${_.upperFirst(includeModelName)}Id`];

            if (associatedId) {
              const includedModelInstance = sails.models[includeModelName.toLowerCase()];
              const deletedAssociatedModelId = await includedModelInstance.destroy({
                where: { id: associatedId },
                force,
              });
              const message = `[!] Delete  "${modelName}"'s associated model "${includeModelName}" with id "${associatedId}" (?=${deletedAssociatedModelId})`;

              if (deletedAssociatedModelId) {
                sails.log.debug(`${message} success.`);
              } else {
                sails.log.debug(`${message} failed.`);
              }
            } else {
              throw Error(`${modelName} has no associated with ${includeModel}.`);
            }
          }
        }
        const result = await model.destroy({
          where: { id },
          force,
        });
        results.push(result);
      }
      // console.log('results=>', results);
      return results;
    } catch (e) {
      throw e;
    }
  },

  /**
   * 依據 ID 取回詳細資料。
   * @version 1.0
   * @param Required {Object} {
   *     langCode{String} = 'zh-TW',      要查詢的資料語系。
   *     modelName{String} = null,        要查詢的目標 Sequelize Model 名稱。
   *     include{Object|Array} = null,    額外給予的 Sequelize Query-include 參數。
   *     where{Object} = null,            Sequelize Query-where 查詢。
   *     attributes{Object|Array} = null, 查詢時的 Sequelize Query-attributes 參數。
   *   }
   * @param Optional {Object} {
   *     required{Array} = [],     要被設定為 required 的欄位名稱。
   *     readonly{Array} = [],     要被設定為 readonly 的欄位名稱。
   *     format{Object} = null,     預先定義的資料格式。
   *     formatCb{Function} = null, 最後輸出前再次格式化資料的 callback。
   *   }
   * @example 依據 Parent ID 查詢 User 與 Parent，同時包含 Student。
   * QueryService.getDetail({
   *    modelName: 'User',
   *    where: { id: { $not: null } },
   *    attributes: [
   *      'id',
   *      'email',
   *      'nameTW',
   *      'nameEN',
   *    ],
   *    include: [{
   *      model: Parent,
   *      where: { id: parentId },
   *      attributes: {
   *        exclude: ['createdAt', 'updatedAt'],
   *      },
   *      include: [{
   *        model: Student,
   *        through: 'StudentParent',
   *        attributes: ['id', 'idNumber1', 'idNumber2'],
   *        include: [{
   *          model: User,
   *          attributes: ['id', 'email', 'nameTW', 'nameEN'],
   *        }],
   *      }],
   *    }],
   *  }, {
   *    required,
   *    readonly,
   *    format: null,
   *    formatCb: e => ({
   *      data: {
   *        ...e.data,
   *        Parent: {
   *          ..._.omit(e.data.Parent, ['Students']),
   *          Students: e.data.Parent.Students.map(s => ({
   *            ..._.omit(s, ['StudentParent']),
   *            relationship: s.StudentParent.relationship,
   *            comment: s.StudentParent.relationship,
   *          })),
   *          passportDuedate1:
   *            moment(e.data.Parent.passportDuedate1, 'YYYY/MM-DD').format('YYYY-MM-DD'),
   *          passportDuedate2:
   *            moment(e.data.Parent.passportDuedate2, 'YYYY/MM-DD').format('YYYY-MM-DD'),
   *          birthday:
   *            moment(e.data.Parent.birthday, 'YYYY/MM-DD').format('YYYY-MM-DD'),
   *        },
   *      },
   *      fields,
   *    }),
   *  });
   * @returns {Object} 屬於某個 ID 的資料。
   */
  async getDetail({
    langCode = 'zh-TW',
    modelName = null,
    where = null,
    include = null,
    attributes = null,
  }, {
    required = null,
    readonly = null,
    view = true,
    outputFieldNamePairs = null,
    viewExclude = null,
    viewInclude = null,
    format = null,
    formatCb = null,
  } = {}) {
    const extra = {};
    try {
      const inputHasNull = ValidatorHelper.checkNull([
        modelName,
      ]);
      if (inputHasNull) {
        throw Error(KEY.BAD_REQUEST.NO_REQUIRED_PARAMETER(inputHasNull));
      }
      if (!include && !where) {
        throw Error(KEY.BAD_REQUEST.NO_REQUIRED_PARAMETER('include or where'));
      }
      const model = sails.models[modelName.toLowerCase()];
      if (!model) {
        throw Error(KEY.BAD_REQUEST.MODEL_NOT_EXISTS(model));
      }
      if (langCode) {
        // TODO: 語系篩選
      }
      // 自動整合欄位類型與選項
      let fields = this.getModelOutputColumns({
        langCode,
        modelName,
        required,
        readonly,
        excludes: viewExclude,
        includes: viewInclude,
      });
      // 組合查詢 Query
      const query = {};
      if (where) { query.where = where; }
      if (include && _.isArray(include)) {
        query.include = [];
        include.forEach((e) => {
          const arr = this.getModelOutputColumns({
            modelName: e.model ? e.model.name : e.modelName,
            as: e.as,
            excludes: ['id', 'createdAt', 'updatedAt', 'deletedAt'],
            modelPrefix: true,
            langCode,
            required,
            readonly,
          });
          fields = fields.concat(arr);
          const inc = {
            model: e.model ? e.model : sails.models[e.modelName.toLowerCase()],
          };
          if (e.as) { inc.as = e.as; }
          if (e.limit) { inc.limit = e.limit; }
          if (e.where) { inc.where = e.where; }
          if (e.through) { inc.through = e.through; }
          if (e.include) { inc.include = e.include; }
          if (e.required) { inc.required = e.required; }
          if (e.attributes) { inc.attributes = e.attributes; }
          query.include.push(inc);
        });
      }
      if (attributes) {
        query.attributes = attributes;
        fields = fields.filter(e => attributes.some(attr => e.name === attr));
      }
      // console.log('fields=>', fields);
      // console.log('query=>');
      // console.dir(query);
      const data = await model.findOne(query);
      if (!data) {
        throw Error(KEY.BAD_REQUEST.NO_TARGET_FOUNDED(`${modelName}:${_.values(where)}`));
      }

      // 自動取出關聯的資料欄位與對應資料來源，並且將欄位設成 chosen 以供選擇
      if (view) {
        extra._associations = this.getAssociations(modelName);
        {
          const associatedData = {};
          // 只取出 1v1 的關聯，即當下 model 中的 AbcId 欄位的 model Abc
          const associatedModels = this.getAssociations(modelName, {
            one2One: true,
          });
          for (const target of associatedModels) {
            const modelData = await sails.models[target.toLowerCase()].findAll();
            // console.log('modelData=>', modelData);
            associatedData[target] = modelData;
          }
          fields.map((field) => {
            const isThisFieldAssociated = associatedModels.some(ass => field.name === `${ass}Id`);
            // console.log('isThisFieldAssociated=>', isThisFieldAssociated);
            if (isThisFieldAssociated) {
              const associatedModelName = field.name.replace('Id', '');
              const values = associatedData[associatedModelName];
              /* eslint no-param-reassign: 0 */
              let modelOutputPropName = null;
              {
                console.log('associatedModelName=>', associatedModelName);
                // 如果有指定哪個 model 使用哪個 prop 輸出
                const assignModelOutputField = outputFieldNamePairs
                  ? outputFieldNamePairs.filter(pair => pair.modelName === associatedModelName)[0]
                  : null;
                console.log('assignModelOutputField=>', assignModelOutputField);
                modelOutputPropName = assignModelOutputField
                  ? assignModelOutputField.target
                  : null;
                console.log('modelOutputPropName=>', modelOutputPropName);
              }
              // 可能要再加上一對多判斷
              field.type = 'chosen';
              field.required = true;
              field.values = values
                ? values
                  .concat([{ id: null }])
                  .map((v) => {
                    let name = v[modelOutputPropName] || v.name || v.key || v.id;
                    if (_.isFunction(modelOutputPropName)) {
                      name = modelOutputPropName(v);
                    }
                    return {
                      value: v.id,
                      name,
                    };
                  })
                : [];
            }
            return field;
          });
        }
      }
      return this.formatOutput({
        format,
        formatCb,
        fields,
        required,
        readonly,
        data: data.toJSON(),
        extra,
      });
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 取出目標 Model 全部是文字類型的欄位名稱
   * @version 1.0
   * @param {String} modelName = null 要查詢的目標 Sequelize Model 名稱。
   * @example 取出 Parent 中，全部屬性為文字類型的欄位名稱。
   * QueryService.getModelSearchableColumns('Parent');
   * // *  [{ key: 'Parent.education', type: 'String' }
   * // *   { key: 'Parent.password', type: 'String' }]
   * @returns {Array} Object contains field and type
   */
  getModelSearchableColumns(modelName = null, {
    date = false,
    integer = false,
  } = {}) {
    try {
      const model = sails.models[modelName.toLowerCase()];
      // 取出全部的 model field
      const targets = [];
      // eslint-disable-next-line
      for (const key in model.rawAttributes) {
        if (model.rawAttributes[key].type.key === 'STRING'
            || model.rawAttributes[key].type.key === 'TEXT'
            || model.rawAttributes[key].type.key === 'JSON'
            || model.rawAttributes[key].type.key === 'UUID'
            || model.rawAttributes[key].type.key === 'ENUM'
        ) {
          targets.push({
            key: `${modelName}.${key}`,
            type: 'STRING',
          });
        }
        if (date
            && (model.rawAttributes[key].type.key === 'DATE'
            || model.rawAttributes[key].type.key === 'DATEONLY')) {
          targets.push({
            key: `${modelName}.${key}`,
            type: 'DATE',
          });
        }
        if (integer
          && model.rawAttributes[key].type.key === 'INTEGER') {
          targets.push({
            key: `${modelName}.${key}`,
            type: 'NUMBER',
          });
        }
      }
      // 移除不必要的屬性
      const excludes = [
        'createdAt',
        'updatedAt',
      ];
      return targets.filter(e => !excludes.some(ex => ex === e));
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 取得傳入的 model column ENUM 的值
   * @version 1.0
   * @param {String} [modelName=null]
   * @param {String} [columnName=null]
   * @example 取出 Parent 中 ENUM 欄位 union 的全部值。
   * QueryService.getEnumValues('Parent', 'union');
   * // * [ '非會員', '個人會員', '學生會員', '相關會員', '理事', '監事', '理事長', '常務理事', '常務監事' ]
   * @returns {Array} column's ENUM values.
   */
  getEnumValues(
    modelName = null,
    columnName = null,
  ) {
    try {
      if (!modelName || !columnName) {
        throw Error('Missing required parameter: `modelName` is required.');
      }
      const model = sails.models[modelName.toLowerCase()];
      const values = model.rawAttributes[columnName].values;
      return _.isArray(values) ? values : null;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 產生 VUE form 需要的欄位名稱與類型
   * @param {any} {
   *     modelName = null,
   * }
   * @returns
   */
  getModelOutputColumns({
    langCode = null,
    modelName = null,
    modelPrefix = false,
    readonly = null,
    required = null,
    excludes = null,
    includes = null,
  }) {
    try {
      let prefix = '';
      if (_.isBoolean(modelPrefix)) {
        prefix = modelPrefix ? `${modelName}.` : '';
      } else if (_.isString(modelPrefix)) {
        prefix = `${modelPrefix}.`;
      }
      const model = sails.models[modelName.toLowerCase()];
      if (!modelName) {
        throw Error(KEY.BAD_REQUEST.NO_REQUIRED_PARAMETER('modelName'));
      }
      if (!model) {
        throw Error(KEY.BAD_REQUEST.MODEL_NOT_EXISTS(model));
      }
      const fields = [];
      for (const name of _.keys(model.rawAttributes)) {
        const modelAttr = model.rawAttributes[name];
        const field = {
          values: null,
          // FIXME: 找出更好的取字串方式，不要用巢狀三元
          name: modelPrefix ? (this.isCommonField(name) ? name : `${prefix}${name}`) : name,
        };
        // 自動依據資料庫轉型 input
        switch (modelAttr.type.key) {
          case 'ENUM':
            field.type = 'chosen';
            field.values = modelAttr.values.map(e => ({
              value: e,
              name: e,
            }));
            break;
          case 'DOUBLE PRECISION':
          case 'INTEGER':
            field.type = 'number';
            break;
          case 'DATEONLY':
            field.type = 'date';
            break;
          default: {
            // eslint-disable-next-line no-underscore-dangle
            const length = modelAttr.type._length;
            if (length) {
              field.limit = length - 1;
            }
            field.type = modelAttr.type.key.toLowerCase();
            break;
          }
        }
        fields.push(field);
      }
      const autoReadonly = ['createdAt', 'updatedAt', 'deletedAt', 'id'].concat(readonly || []);
      const autoRequired = this.getModelColumns({
        modelName,
        excludes: autoReadonly,
        required: true,
      }).concat(required || []);

      const getPhrase = (name) => {
        const output = modelPrefix
          ? `model.${_.upperFirst(name)}` : `model.${_.upperFirst(modelName)}.${name}`;
        return this.isCommonField(name) ? `model.${name}` : output;
      };
      return fields
        .filter(e => (!_.isEmpty(includes)
          ? includes.some(inc => e.name === inc)
          : e))
        .filter(e => (!_.isEmpty(excludes)
          ? (!excludes.some(ex => e.name === ex))
          : e))
        .map(field => ({
          ...field,
          label: sails.__({
            phrase: getPhrase(field.name),
            locale: langCode || 'zh-TW',
          }),
          required: autoRequired
            .some(r => r === field.name),
          readonly: autoReadonly
            .some(r => r === field.name),
        }));
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 依據給予的 Sequelize Model 名稱，產生空白的欄位格式 JSON，並以 null 填充。
   * @version 20180310
   * @param {Object} {
   *     modelName{String} = null, 目標 Model 名稱。
   *     excludes{Array} = [], 要排除的欄位名稱。
   *     includes{Array} = [], 要額外加入的欄位名稱。
   * }
   * @example
   * QueryService.buildEmptyModel({
   *    modelName: 'User',
   *    excludes: ['id'],
   * }),
   * // {
   * //  locale: null,
   * //  weights: null,
   * //  gender: null,
   * //  resetPasswordTokenExpire: null,
   * //  username: null,
   * //  avatar: null,
   * //  avatarThumb: null,
   * //  score: null,
   * //  isActived: null,
   * //  resetPasswordToken: null,
   * //  verificationEmailToken: null,
   * //  isEmailVerified: null,
   * //  createdAt: null,
   * //  updatedAt: null,
   * //  deletedAt: null,
   * // }
   * @returns {Object} 空的 model 欄位格式 JSON。
   */
  buildEmptyModel({
    modelName = null,
    excludes = [],
    includes = [],
  } = {}) {
    try {
      const model = {};
      this.getModelColumns({
        modelName,
        excludes,
        includes,
      }).forEach((e) => {
        model[e.replace(`${modelName}.`, '')] = null;
      });
      return model;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 取得某個 Sequelize Model 的所有欄位名稱。
   * @version 20180310
   * @param {Object} {
   *     modelPrefix = false,
   *     modelName = null,
   *     excludes = [],
   *     includes = [],
   *   }
   * @example 取得 Parent 的欄位，同時加上 email/nameTW/nameEN 三個額外欄位、排除
   * id/UserId/createdAt/updatedAt 四個欄位，並且在查詢得到的欄位名稱前加上 `Parent` prefix。
   * QueryService.getModelColumns({
   *    modelName: 'Parent',
   *    modelPrefix: true,
   *    excludes: ['id', 'UserId', 'createdAt', 'updatedAt'],
   *    includes: ['email', 'nameTW', 'nameEN'],
   *  });
   * // [ 'Parent.education',
   * //   'Parent.union',
   * //   'Parent.phone',
   * //   'Parent.fax',
   * //   'Parent.app',
   * //   'Parent.comment',
   * //   'Parent.address',
   * //   'Parent.passportName',
   * //   'Parent.profession',
   * //   'Parent.birthday',
   * //   'Parent.idNumber',
   * //   'Parent.mobile',
   * //   'Parent.city',
   * //   'Parent.password',
   * //   'Parent.studentNames',
   * //   'email',
   * //   'nameTW',
   * //   'nameEN' ]
   * @returns {Array} Sequelize Model column names
   * @see {@link https://lodash.com/docs/4.17.5#keys}
   */
  getModelColumns({
    modelPrefix = false,
    modelName = null,
    excludes = [],
    includes = [],
    required = false,
  }) {
    let prefix = '';
    if (_.isBoolean(modelPrefix)) {
      prefix = modelPrefix ? `${modelName}.` : '';
    } else if (_.isString(modelPrefix)) {
      prefix = `${modelPrefix}.`;
    }
    try {
      const model = sails.models[modelName.toLowerCase()];
      // 自動取得所有欄位
      const attributes = _.keys(model.rawAttributes)
        .filter(column => !excludes.some(ex => column === ex))
        .filter((column) => {
          if (required) {
            const target = model.rawAttributes[column];
            // console.log('target=>', target);
            return target.allowNull !== true && target.primaryKey !== true;
          }
          return true;
        })
        .map(e => (`${_.upperFirst(prefix)}${e}`))
        .concat(includes);
      return attributes;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 取得特定 model 內 column 的類型，回傳值為 Sequelize 的 type 字串。
   * @version 20180331
   * @param {Object} {
   *     modelName{String} = null,
   *     columnName{String} = null,
   *  }
   * @example 取得 User 的 email 欄位類型
   * getModelColumnType({
   *    modelName = 'User',
   *    columnName = 'email',
   * });
   * // 'String'
   * @returns {String|Null} column type
   * @see {@link http://docs.sequelizejs.com/manual/tutorial/models-definition.html}
   */
  getModelColumnType({
    modelName = null,
    columnName = null,
  }) {
    try {
      const model = sails.models[modelName.toLowerCase()];
      // 自動取得所有欄位
      const column = model.rawAttributes[columnName];
      if (!_.isNil(column)) {
        return column.type.key;
      }
      return null;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 依據輸入資料格式化查詢 query
   * @version 1.0
   * @param {Object} {
   *     langCode{String} = 'zh-TW',      要查詢的資料語系。
   *     modelName{String} = null,        要查詢的目標 Sequelize Model 名稱。
   *     filter = null,
   *     include{Object|Array} = null, 額外給予的 Sequelize include Query。
   *     curPage = 1,
   *     perPage = 10,
   *     sort = 'DESC',
   *     order = null,
   *   }
   * @example
   * @returns {Object}
   */
  formatQuery({
    attributes = null,
    langCode = 'zh-TW',
    modelName = null,
    filter = null,
    include = null,
    curPage = 1,
    perPage = 10,
    sort = 'DESC',
    by = 'createdAt',
    order = null,
    group = null,
    collate = null,
    log = false,
    condition = '$and',
  }) {
    try {
      let mOrder = order || [[Sequelize.col(by), sort]];
      let intPage = Number(curPage);
      let intLimit = Number(perPage);
      if (_.isNaN(intPage)) intPage = 1;
      if (_.isNaN(intLimit)) intLimit = 10;
      // sails.log('filter=>', filter);

      if (order) {
        // mOrder = order.map(e => [e, sort]);
        mOrder = order;
      }

      if (langCode) {
        // TODO: 語系篩選
      }

      // 組合搜尋 query
      let query = {
        where: {},
        limit: intLimit,
        offset: (intPage - 1) * intLimit,
        order: mOrder,
      };

      if (include && _.isArray(include)) {
        query.include = [];
        include.forEach((e) => {
          const inc = {
            model: e.model ? e.model : sails.models[e.modelName.toLowerCase()],
          };
          if (e.as) { inc.as = e.as; }
          if (e.limit) { inc.limit = e.limit; }
          if (e.where) { inc.where = e.where; }
          if (e.include) { inc.include = e.include; }
          if (e.through) { inc.through = e.through; }
          if (e.required) { inc.required = e.required; }
          if (e.attributes) { inc.attributes = e.attributes; }
          query.include.push(inc);
        });
      }

      if (attributes) {
        query.attributes = attributes;
      }

      // 如果有指定完全符合欄位
      if (filter.where) {
        if (!query.where[condition]) {
          query.where[condition] = [];
        }
        if (_.isArray(filter.where)) {
          // eslint-disable-next-line guard-for-in
          for (const field of filter.where) {
            // console.log('field=>', field);
            query.where[condition].push(field);
          }
        } else if (_.isObject(filter.where)) {
          query.where[condition] = filter.where;
        } else {
          throw Error('parameter `filter.where` has to be Array or Object.');
        }
      }

      // 如果有指定配對的搜尋欄位
      if (!_.isEmpty(filter.fields)) {
        if (!query.where.$and) {
          query.where.$and = [];
        }
        if (query.where.$and instanceof Array) {
          filter.fields.forEach((e) => {
            // 轉型
            let value = isNumeric(e.value) ? parseInt(e.value, 10) : e.value;
            value = _.isDate(value) ? new Date(value) : value;
            query.where.$and.push(
              Sequelize.where(
                Sequelize.col(`${e.key}`), 'like', `%${value}%`,
              ),
            );
          });
        }
      }

      // 全文檢索 - 如果有輸入關鍵字
      const hasKeyword = (filter.search && filter.search.keyword);
      const hasSearchText = filter.searchText; // 相容舊版寫法
      if (hasKeyword || hasSearchText) {
        let kw = '';
        let targets = null;

        // 搜尋關鍵字
        if (hasKeyword) {
          kw = filter.search.keyword.trim();
          targets = filter.search.fields;
        }
        if (hasSearchText) {
          kw = filter.searchText.trim();
        }

        // 搜尋的目標欄位
        if (!targets) {
          targets = this.getModelSearchableColumns(modelName)
            .map(e => e.key);
        }

        // 防錯
        if (!query.where.$or) {
          query.where.$or = [];
        }

        // 推入搜尋目標
        query.where.$or = targets.map(e => Sequelize.where(Sequelize.col(e), 'like', `%${kw}%`));

        // 額外目標欄位
        if (filter.search.extra) {
          filter.search.extra.forEach((e) => {
            query.where.$or.push(
              Sequelize.where(Sequelize.col(e), 'like', `%${kw}%`),
            );
          });
        }
      }

      // 搜尋前最後再整理一次 query
      query = {
        ...query,
        collate,
        subQuery: false,
        duplicating: false,
      };
      if (log) {
        if (_.isObject(log)) {
          query.logging = log;
        }
        query.logging = console.log;
      }
      if (_.isNil(group) && include) {
        query.group = [`${modelName}.id`];
      } else if (!_.isNil(group)) {
        query.group = group;
      }
      // console.log('query=>');
      // console.dir(query);
      return query;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * 依據輸入資料回傳分頁資料
   * @version 1.0
   * @param {Object} {
   *     modelName = null,
   *     include = null,
   *   }
   * @param {Object} {
   *     langCode = 'zh-TW',
   *     filter = null,
   *     curPage = 1,
   *     perPage = 10,
   *     sort = 'DESC',
   *     log = false,
   *   }
   * @param {Object} {
   *     format = null,
   *     formatCb = null,
   *   }
   * @example 查詢 User 包含 Parent
   * QueryService.findBy({
   *     modelName: 'User',
   *     include: [
   *       { model: Parent,
   *         required: true,
   *       },
   *     ],
   *   }, {
   *     filter: {
   *       ...mFilter,
   *       search: {
   *         keyword: mFilter.searchText,
   *         extra: [
   *           'User.nameEN', 'User.nameTW',
   *           ...QueryService.getModelSearchableColumns('Parent'),
   *         ],
   *       },
   *     },
   *     curPage,
   *     perPage,
   *     sort,
   *     order: ['id'],
   *   }, {
   *     format: null,
   *     formatCb: e => ({
   *       // 先展開 Parent
   *       ...e.data.Parent,
   *       // 再存入 user 資料避免重疊
   *       userId: e.data.id,
   *       createdAt: moment(e.createdAt).format('MM/DD/YYYY'),
   *       name: {
   *         'zh-TW': e.data.nameTW,
   *         en: e.data.nameEN,
   *       },
   *       isActived: e.data.isActived,
   *       studentNames: e.data.Parent.studentNames,
   *     }),
   *   });
   * @returns {Object}
   */
  async findBy({
    modelName = null,
    scope = null,
    include = null,
    attributes = null,
    includeColumns = null,
    excludeColumns = null,
  } = {}, {
    langCode = 'zh-TW',
    filter = null,
    curPage = 1,
    perPage = 10,
    sort = 'DESC',
    by = 'createdAt',
    order = null,
    collate = null,
    log = false,
    group = null,
  } = {}, {
    view = true,
    format = null,
    formatCb = null,
  } = {}) {
    let extra = {};
    // const now = new Date().getTime();
    // const tag = `${modelName}-findBy-${now}`;
    try {
      const inputHasNull = ValidatorHelper.checkNull([
        modelName,
        filter,
      ]);
      if (inputHasNull) {
        throw Error(KEY.BAD_REQUEST.NO_REQUIRED_PARAMETER(inputHasNull));
      }
      // if (by) {
      //   const getModelColumns = name => this.getModelColumns({ modelName: name });
      //   const isByExistInModel = getModelColumns(modelName)
      //     .some(e => e.toString() === by.toString());

      //   if (!isByExistInModel && !_.isEmpty(include)) {
      //     include
      //       .forEach((inc) => {
      //         console.log('inc=>', inc);
      //         const incModelName = inc.modelName ? inc.modelName : inc.model.name;
      //         const isByExistInIncludeModel = getModelColumns(incModelName)
      //           .some(e => e.toString() === by.toString());
      //         if (isByExistInIncludeModel) {
      //           // eslint-disable-next-line
      //           by = inc.model ? `${inc.model.name}.${by}` : `${inc.modelName}.${by}`;
      //         }
      //       });
      //   }
      //   console.log('findBy order by=>', by);
      // }
      // console.time(tag);
      const query = this.formatQuery({
        attributes,
        langCode,
        curPage,
        perPage,
        filter,
        sort,
        by,
        order,
        collate,
        modelName,
        include,
        log,
        group,
      });
      if (log) {
        sails.log.debug('query=>');
        console.dir(query);
      }
      let data = null;
      if (scope) {
        data = await sails.models[modelName.toLowerCase()]
          .scope(scope)
          .findAndCountAll(query);
      } else {
        data = await sails.models[modelName.toLowerCase()]
          .findAndCountAll(query);
      }
      // console.log('data=>', data);

      const items = data.rows.map(e => this.formatOutput({
        modelName,
        format,
        formatCb,
        data: e ? e.toJSON() : null,
      }));
      const total = typeof data.count === 'number'
        ? data.count : data.count.length;
      if (view) {
        extra = {
          ...this.getIndexPageTableAndFilters({
            modelName,
            langCode,
            include,
            includeColumns,
            excludeColumns,
          }),
          _associations: this.getAssociations(modelName),
        };
      }
      // console.timeEnd(tag);
      return {
        paging: {
          lastPage: Math.ceil(total / perPage),
          curPage: parseInt(curPage, 10),
          perPage: parseInt(perPage, 10),
          sort: sort.toUpperCase(),
          by: by.toLowerCase(),
          total,
        },
        filter,
        items,
        ...extra,
      };
    } catch (e) {
      // console.timeEnd(tag);
      sails.log.error(e);
      throw e;
    }
  },


  /**
   * 取得給予 ModelName 之關聯 ModelName，可透過參數指定取得單數或複數名稱。
   * @param {*} modelName
   * @param {*} { singular = false, plural = false }
   * @returns [String...]
   */
  getAssociations(modelName, {
    singular = false,
    plural = false,
    one2One = false,
    one2Many = false,
  } = {}) {
    const associations = sails.models[modelName.toLowerCase()].associations;
    const result = [];
    Object.keys(associations).forEach((key) => {
      const association = {};
      // all needed information in the 'options' object
      if (_.has(associations[key], 'options')) {
        association[key] = associations[key].options;
        const singularName = association[key].name.singular;
        const pluralName = association[key].name.plural;
        if (associations[key].options.constraints !== false) {
          if (singular) {
            result.push(singularName);
          } else if (plural) {
            result.push(pluralName);
          } else if (one2One) {
            if (key === singularName) result.push(key);
          } else if (one2Many) {
            if (key === pluralName) result.push(key);
          } else {
            result.push(key);
          }
        }
      }
    });
    return result;
  },

  modelAssociationsToArray(model) {
    const result = [];
    if (typeof model !== 'object' || typeof model.associations !== 'object') {
      throw Error("Model should be an object with the 'associations' property.");
    }
    Object.keys(model.associations).forEach((key) => {
      const association = {};
      // all needed information in the 'options' object
      if (_.has(model.associations[key], 'options')) {
        association[key] = model.associations[key].options;
      }
      result.push(association);
    });
    return result;
  },

  getIndexPageTableAndFilters({
    langCode = 'zh-TW',
    modelName,
    include,
    includeColumns,
    excludeColumns,
  }) {
    try {
      // 取出全部的 table 欄位
      const autoIncludeColumns = include ? _.flattenDeep(include.map((e) => {
        // console.log('autoIncludeColumns e=>', e);
        if (!_.isObject(e)) {
          throw Error('include model must be an object.');
        }
        return (QueryService.getModelColumns({
          modelName: e.model ? e.model.name : e.modelName,
          modelPrefix: true,
          excludes: ['id', 'updatedAt', 'deletedAt'],
        })) || [];
      })) : [];
      // console.log('includeColumns=>', includeColumns);

      // 取出表格欄位
      let columns = includeColumns || this.getModelColumns({
        modelName,
        modelPrefix: false,
        excludes: excludeColumns || ['updatedAt', 'deletedAt'],
        includes: autoIncludeColumns,
      });
      if (excludeColumns) {
        columns = columns.filter(c => !(excludeColumns.some(e => e === c)));
      }

      // 取出表頭
      const isAutoIncludeField = name => (autoIncludeColumns.some(col => col === name)
        ? `model.${_.upperFirst(name)}` : `model.${_.upperFirst(modelName)}.${name}`);

      const headers = columns.map(col => ({
        label: sails.__({
          phrase:
            this.isCommonField(col) ? `model.${col}` : isAutoIncludeField(col),
          locale: langCode,
        }),
        key: `${_.upperFirst(modelName)}.${col}`,
      }));
      // 取出可搜尋欄位
      const searchable = this.getModelSearchableColumns(modelName, {
        date: true,
        integer: true,
      }).map(e => ({
        label: sails.__({
          phrase: this.isCommonField(e.key)
            ? `model${e.key.replace(modelName, '')}` : `model.${e.key}`,
          locale: langCode,
        }),
        key: e.key,
        type: e.type,
      }));
      return {
        table: {
          headers,
          columns,
        },
        searchable,
      };
    } catch (e) {
      throw e;
    }
  },

  async getDetailPageFieldWithAssociations({
    modelName,
    langCode = 'zh-TW',
    outputFieldNamePairs = null,
    // [{ modelName: 'User', displayField: 'username' }]
    // [{ modelName: 'User', displayField: 'username' }]
    autoInclude = false,
    exclude = [],
    include = [],
    required = [],
    readonly = [],
  }) {
    sails.log(`=== getPageFields modelName: "${modelName}", langCode: "${langCode}" ===`);
    try {
      // 建立全部欄位名稱
      const fieldNames = QueryService.getModelOutputColumns({
        modelPrefix: false,
        modelName,
        excludes: ['id', 'createdAt', 'updatedAt', 'deletedAt'],
        langCode,
      });
      // 建立空資料
      const emptyModel = QueryService.buildEmptyModel({
        modelName,
        excludes: ['id', 'createdAt'],
      });

      // 自動取出關聯的資料欄位
      {
        const associatedData = {};
        // 只取出 1v1 的關聯，即當下 model 中的 AbcId 欄位的 model Abc
        const associatedModels = this.getAssociations(modelName, {
          one2One: true,
        });
        for (const target of associatedModels) {
          const modelData = await sails.models[target.toLowerCase()].findAll();
          // console.log('modelData=>', modelData);
          associatedData[target] = modelData;
        }
        fieldNames.map((field) => {
          const isThisFieldAssociated = associatedModels.some(ass => field.name === `${ass}Id`);
          // console.log('isThisFieldAssociated=>', isThisFieldAssociated);
          if (isThisFieldAssociated) {
            const associatedModelName = field.name.replace('Id', '');
            const values = associatedData[associatedModelName];
            /* eslint no-param-reassign: 0 */
            let modelOutputPropName = null;
            {
              // console.log('associatedModelName=>', associatedModelName);
              // 如果有指定哪個 model 使用哪個 prop 輸出
              const assignModelOutputField = outputFieldNamePairs
                ? outputFieldNamePairs.filter(pair => pair.modelName === associatedModelName)[0]
                : null;
              // console.log('assignModelOutputField=>', assignModelOutputField);
              modelOutputPropName = assignModelOutputField
                ? assignModelOutputField.target
                : null;
              // console.log('modelOutputPropName=>', modelOutputPropName);
            }
            // 可能要再加上一對多判斷
            field.type = 'chosen';
            field.required = true;
            field.values = values
              ? values
                .concat([{ id: null }])
                .map((v) => {
                  let name = v[modelOutputPropName] || v.name || v.key || v.id;
                  if (_.isFunction(modelOutputPropName)) {
                    name = modelOutputPropName(v);
                  }
                  return {
                    value: v.id,
                    name,
                  };
                })
              : [];
          }
          return field;
        });
      }
      return {
        ..._.omit(emptyModel, exclude),
        _fields: _.differenceBy(
          fieldNames,
          exclude.map(e => ({ name: e })),
          'name',
        )
          .concat(include)
          .map((field) => {
            const isTarget = required.some(r => r === field.name);
            if (isTarget) {
              field.required = true;
            }
            return field;
          }),
      };
    } catch (e) {
      throw e;
    }
  },
};
