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

  describe('Set User Data', function() {
    beforeEach(function() {
      MainModule.setUsersDB({
        '123': {
          id: '123',
          socket: 'init-socket'
        }
      })
    })

    it('should return a Task', function() {
      const userId = '123'
      const result = MainModule.setUserData(userId, {})
      const condition = result instanceof Task
      expect(condition).toExist('Result should be an instance of Task')
    })

    it('should create new user with data if it does not exist', function() {
      const userId = '234'
      const response = {
        id: '234',
        socket: 'new-socket'
      }
      const result = MainModule.setUserData(userId, 'new-socket').fork(e => {
        expect(true).toNotExist('Error should never run as we are saving to local cache')
      }, r => {
        expect(r).toEqual(response, 'New user data should be created')
      })
    })

    it('should replace user data if it exists', function() {
      const userId = '123'
      const response = {
        id: '123',
        socket: 'new-socket'
      }

      MainModule.getUserData(userId).fork(e => {
        expect(true).toNotExist('When user exist the error branch should not run')
      }, r => {
        expect(r).toEqual({ id: '123', socket: 'init-socket' }, 'Result should contain user\'s data')

        MainModule.setUserData(userId, 'new-socket').fork(e => {
          expect(true).toNotExist('Error should never run as we are saving to local cache')
        }, r => {
          expect(r).toEqual(response, 'User data should be modified')
        })

      })
    })
  })
})