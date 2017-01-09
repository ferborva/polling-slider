const MainModule = require('../app')
const R = require('ramda')
const Task = require('data.task')
const expect = require('expect')

let userDB = {};

describe('DB Tasks', function() {
  describe('Get User Data', function() {

    beforeEach(function() {
      MainModule.setUsersDB({
        '123': {
          data: 'test-data'
        }
      })
    })

    it('should return a Task', function() {
      const userId = '123'
      const result = MainModule.getUserData(userId)
      const condition = result instanceof Task
      expect(condition).toExist('Result should be an instance of Task')
    })

    it('should return user data if he/she exists', function() {
      const userId = '123'
      const result = MainModule.getUserData(userId).fork(e => {
        expect(true).toNotExist('When user exist the error branch should not run')
      }, r => {
        expect(r).toEqual({data: 'test-data'}, 'Result should contain user\'s data')
      })
    })

    it('should return "User not found" msg when user does not exist', function() {
      const userId = '234'
      const result = MainModule.getUserData(userId).fork(e => {
        expect(e).toEqual('User not found', 'Result should contain user not found msg')
      }, r => {
        expect(true).toNotExist('When user does not exist the result branch should not run')
      })
    })
  })
})