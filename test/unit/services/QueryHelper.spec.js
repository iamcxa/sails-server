describe('about NotifierHelper operation.', () => {
  let user;
  let userDeviceAndroid;
  let userDeviceIosFCM;
  let userDeviceIosAPNS;
  let notification;
  let message;

  before('測試用 config', async () => {
    try {
      user = await User.create({
        username: 'NotifierHelper',
        email: 'NotifierHelper@xxx.xxx',
        firstName: 'NotifierHelper',
        lastName: 'NotifierHelper',
        locale: 'zh_TW',
        Roles: ['admin', 'user'],
      });
      userDeviceAndroid = await UserDevice.create({
        platform: 'ANDROID',
        deviceToken: '',
      });

      userDeviceIosFCM = await UserDevice.create({
        platform: 'IOS_FCM',
        deviceToken: '',
      });

      userDeviceIosAPNS = await UserDevice.create({
        platform: 'IOS_APNS',
        deviceToken: '',
      });

      user.addUserDevices([userDeviceIosFCM, userDeviceAndroid]);

      const messageAttributes = {
        subject_type: {
          DataType: 'String',
          StringValue: 'SYSTEM_PRIVATE_MESSAGE',
        },
        actionType: {
          DataType: 'String',
          // StringValue: 'pending'
          StringValue: 'processing',
          // StringValue: 'finish'
          // StringValue: 'members'
        },
      };
      message = {
        subject: '12345',
        content: '12345',
        messageType: 'PUSH',
        messageAttributes,
      };
      notification = await Notification.create();
      await UserNotification.create({
        UserId: user.id,
        NotificationId: notification.id,
      });
    } catch (e) {
      sails.log.error(e);
    }
  });

  it.skip('create User Notification by model should success.', async () => {
    try {
      console.log('=== test OK ===');

      const params = await Notification.findOne({
        where: {
          id: notification.id,
        },
        include: {
          model: User,
          include: UserDevice,
        },
      });

      const result = await NotifierHelper.pushMessageWithModel(params);

      console.log('result=>', JSON.stringify(result, null, 2));
    } catch (e) {
      sails.log.error(e);
    }
  });

  it('create User Notification with User Ids directly should success.', async () => {
    try {
      const result = await NotifierHelper.pushMessage({
        userIds: [user.id],
        data: message,
      });

      console.log('result1=>', JSON.stringify(result, null, 2));
    } catch (e) {
      sails.log.error(e);
    }
  });

  it('create User Notification with User models directly should success.', async () => {
    try {
      const result = await NotifierHelper.pushMessage({
        users: [user],
        data: message,
      });

      console.log('result2=>', JSON.stringify(result, null, 2));
    } catch (e) {
      sails.log.error(e);
    }
  });
});
