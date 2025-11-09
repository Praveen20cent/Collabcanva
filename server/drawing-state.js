module.exports = {
    shouldSnapshot: (room) => room.nextIndex > 0 && room.nextIndex % 200 === 0
  };
  