var Netwalk, log, newgame;

log = function(msg) {
  return $('#console').append('<p>' + msg + '</p>');
};

Netwalk = (function() {

  function Netwalk(options) {
    var defaults, drawTicks, randomizeTicks, self;
    if (options == null) {
      options = {};
    }
    defaults = {
      containerSelector: '#netwalk',
      rows: null,
      columns: null,
      size: 40
    };
    this.options = _.extend(defaults, options);
    self = this;
    this.Dir = {
      up: Vector.create([0, -1]),
      down: Vector.create([0, 1]),
      left: Vector.create([-1, 0]),
      right: Vector.create([1, 0])
    };
    this.Dir.up.flag = this.Dir.down.opposite = 1;
    this.Dir.up.opposite = this.Dir.down.flag = 2;
    this.Dir.left.flag = this.Dir.right.opposite = 4;
    this.Dir.left.opposite = this.Dir.right.flag = 8;
    this.figures = {
      computer: [1, 8, 2, 4],
      server: [17, 24, 18, 20],
      elbow: [9, 10, 6, 5],
      line: [3, 12],
      tee: [13, 11, 14, 7]
    };
    this.container = $(this.options.containerSelector);
    this.container.html('');
    this.container.css('max-width', 'none');
    this.container.css('max-height', 'none');
    if (!(this.options.size != null) && !(this.options.columns != null)) {
      log('at least size or # of columns required');
      return;
    }
    if (!(this.options.size != null)) {
      this.options.size = this.container.width() / this.options.columns;
    }
    if (!(this.options.columns != null)) {
      this.options.columns = Math.round(this.container.width() / this.options.size);
    }
    if (!(this.options.rows != null)) {
      this.options.rows = Math.round(this.container.height() / this.options.size);
    }
    this.container.css('font-size', Math.round(this.options.size / 10 - 1) * 10);
    this.container.css('max-width', "" + this.options.columns + "em");
    this.container.css('max-height', "" + this.options.rows + "em");
    this.drawingIsDone = false;
    self.buildMatrix();
    this.serverVector = Vector.create([1 + _.random(this.options.columns - 2), 1 + _.random(this.options.rows - 2)]);
    this.putOnBoard(this.serverVector, 16);
    drawTicks = setInterval((function() {
      if (!self.tick()) {
        clearInterval(drawTicks);
        return this.drawingIsDone = true;
      }
    }), 5);
    randomizeTicks = setInterval((function() {
      if (!this.drawingIsDone) {
        return;
      }
      if (!self.randomize()) {
        clearInterval(randomizeTicks);
        return self.highlightConnectedNeighboursOf(self.serverVector);
      }
    }), 5);
    this.container.on('selectstart', false).children().each(function(i, tail) {
      return $(tail).on('click', function(event) {
        self.rotate(i);
        $('>', self.container).each(function() {
          return $(this).attr('class', 'tail');
        });
        self.connectedCells = [];
        return self.highlightConnectedNeighboursOf(self.serverVector);
      });
    });
  }

  Netwalk.prototype.rotate = function(cell) {
    var className, figure;
    figure = this.board[cell];
    figure = this.turnFigure(figure);
    this.board[cell] = figure;
    className = this.getClassNameByMask(figure);
    return this.style(cell, className);
  };

  Netwalk.prototype.highlightConnectedNeighboursOf = function(vector, exceptDirection) {
    var cell, d, figure, neighbourCell, neighbourFigure, neighbourVector, type, _results;
    if (exceptDirection == null) {
      exceptDirection = null;
    }
    cell = this.getCellByVector(vector);
    figure = this.board[cell];
    type = this.typeOfFigure(figure);
    if (_.indexOf(this.connectedCells, cell) !== -1) {
      log("cell " + cell + " is already connected");
      return;
    }
    if (type === 'computer') {
      this.connectedCells.push(neighbourCell);
      $('>', this.container).each(function(i, j) {
        if (i === cell) {
          return $(this).attr('class', 'tail--connected');
        }
      });
      return;
    }
    _results = [];
    for (d in this.Dir) {
      if (figure & this.Dir[d].flag) {
        neighbourVector = vector.add(this.Dir[d]);
        if (this.Dir[d].flag === exceptDirection) {
          continue;
        }
        if (!this.inBounds(neighbourVector)) {
          continue;
        }
        neighbourCell = this.getCellByVector(neighbourVector);
        neighbourFigure = this.board[neighbourCell];
        if (neighbourFigure & this.Dir[d].opposite) {
          _results.push(this.highlightConnectedNeighboursOf(neighbourVector, this.Dir[d].opposite));
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Netwalk.prototype.getCellByVector = function(v) {
    return v.elements[0] + v.elements[1] * this.options.columns;
  };

  Netwalk.prototype.getVectorByCell = function(cell) {
    var x, y;
    y = (cell - cell % this.options.columns) / this.options.columns;
    x = cell - this.options.columns * y;
    return Vector.create([x, y]);
  };

  Netwalk.prototype.getClassNameByMask = function(mask) {
    var className;
    className = 'tail__';
    if (mask === 0) {
      className += 'blank';
    } else if (mask & 16 || mask & 32) {
      if (mask & 1) {
        className += 'server--top';
      } else if (mask & 2) {
        className += 'server--bottom';
      } else if (mask & 4) {
        className += 'server--left';
      } else if (mask & 8) {
        className += 'server--right';
      } else {
        className += 'server';
      }
    } else if (mask === 1) {
      className += 'computer--top';
    } else if (mask === 2) {
      className += 'computer--bottom';
    } else if (mask === 4) {
      className += 'computer--left';
    } else if (mask === 8) {
      className += 'computer--right';
    } else if (mask === 3) {
      className += 'line--vertical';
    } else if (mask === 12) {
      className += 'line--horizontal';
    } else if (mask === 9) {
      className += 'elbow--topright';
    } else if (mask === 10) {
      className += 'elbow--rightbottom';
    } else if (mask === 6) {
      className += 'elbow--bottomleft';
    } else if (mask === 5) {
      className += 'elbow--lefttop';
    } else if (mask === 13) {
      className += 'tee--top';
    } else if (mask === 11) {
      className += 'tee--right';
    } else if (mask === 14) {
      className += 'tee--bottom';
    } else if (mask === 7) {
      className += 'tee--left';
    } else {
      className = '';
    }
    return className;
  };

  Netwalk.prototype.numOfCables = function(cell) {
    var cablesMap, count, d;
    cablesMap = this.board[cell];
    count = 0;
    for (d in this.Dir) {
      if (cablesMap & this.Dir[d].flag) {
        ++count;
      }
    }
    return count;
  };

  Netwalk.prototype.typeOfFigure = function(figure) {
    var type;
    for (type in this.figures) {
      if (_.indexOf(this.figures[type], figure) !== -1) {
        return type;
      }
    }
    return null;
  };

  Netwalk.prototype.turnFigure = function(figure) {
    var figureIndex, figures, newFigure, newFigureIndex, type;
    type = this.typeOfFigure(figure);
    if (type != null) {
      figures = this.figures[type];
      figureIndex = _.indexOf(figures, figure);
      newFigureIndex = ++figureIndex < figures.length ? figureIndex : 0;
      newFigure = figures[newFigureIndex];
    } else {
      log("OOPS unknown type for figure " + figure);
    }
    return newFigure;
  };

  Netwalk.prototype.randomFreeDir = function(cell) {
    var d, figure, i, map, numOfCables;
    map = this.neighbours[cell];
    figure = this.board[cell];
    numOfCables = this.numOfCables(cell);
    if (figure & 16 && numOfCables > 0) {
      return null;
    }
    if (numOfCables === 3) {
      return null;
    }
    i = _.random(this.directionsInMap(map));
    for (d in this.Dir) {
      if (map & this.Dir[d].flag && i-- === 0) {
        return this.Dir[d];
      }
    }
    return null;
  };

  Netwalk.prototype.directionsInMap = function(neighboursMap) {
    var count, d;
    count = 0;
    for (d in this.Dir) {
      if (neighboursMap & this.Dir[d].flag) {
        ++count;
      }
    }
    return count;
  };

  Netwalk.prototype.inBounds = function(vector) {
    var x, y;
    x = vector.elements[0];
    y = vector.elements[1];
    return x >= 0 && y >= 0 && x < this.options.columns && y < this.options.rows;
  };

  Netwalk.prototype.putOnBoard = function(vector, directionBit) {
    var cell, d, ncell, nvector, _results;
    cell = this.getCellByVector(vector);
    if (this.board[cell] === 0) {
      this.toDraw.push(vector);
      this.toRandomize.push(vector);
    }
    this.board[cell] |= directionBit;
    _results = [];
    for (d in this.Dir) {
      nvector = vector.add(this.Dir[d]);
      ncell = this.getCellByVector(nvector);
      if (this.inBounds(nvector)) {
        _results.push(this.neighbours[ncell] &= ~this.Dir[d].opposite);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Netwalk.prototype.buildMatrix = function() {
    var cell, d, i, j, nvector, vector, _i, _j, _k, _l, _m, _ref, _ref1, _ref2, _ref3, _ref4, _results, _results1, _results2;
    this.board = (function() {
      _results = [];
      for (var _i = 0, _ref = this.options.columns * this.options.rows; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this);
    this.neighbours = (function() {
      _results1 = [];
      for (var _j = 0, _ref1 = this.options.columns * this.options.rows; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; 0 <= _ref1 ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this);
    this.toDraw = [];
    this.toRandomize = [];
    this.connectedCells = [];
    for (i = _k = 0, _ref2 = this.options.columns; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
      for (j = _l = 0, _ref3 = this.options.rows; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; j = 0 <= _ref3 ? ++_l : --_l) {
        vector = Vector.create([i, j]);
        cell = this.getCellByVector(vector);
        this.board[cell] = 0;
        this.neighbours[cell] = 0;
        for (d in this.Dir) {
          nvector = vector.add(this.Dir[d]);
          if (this.inBounds(nvector)) {
            this.neighbours[cell] |= this.Dir[d].flag;
          }
        }
      }
    }
    _results2 = [];
    for (cell = _m = 0, _ref4 = this.options.columns * this.options.rows; 0 <= _ref4 ? _m < _ref4 : _m > _ref4; cell = 0 <= _ref4 ? ++_m : --_m) {
      _results2.push(this.container.append('<div class="tail"><div class="tail__blank"></div></div>'));
    }
    return _results2;
  };

  Netwalk.prototype.style = function(cell, className) {
    var $node, $tail;
    if (className !== '') {
      cell++;
      $tail = $(":nth-child(" + cell + ")", this.container);
      $node = $(':first-child', $tail);
      return $node.attr('class', className);
    }
  };

  Netwalk.prototype.draw = function() {
    var cell, i, j, _i, _ref, _results;
    _results = [];
    for (i = _i = 0, _ref = this.options.columns; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      _results.push((function() {
        var _j, _ref1, _results1;
        _results1 = [];
        for (j = _j = 0, _ref1 = this.options.rows; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
          cell = this.getCellByVector(Vector.create([i, j]));
          _results1.push(this.style(cell, this.getClassNameByMask(this.board[cell])));
        }
        return _results1;
      }).call(this));
    }
    return _results;
  };

  Netwalk.prototype.tick = function() {
    var cell, d, i, madeConnection, vector, _results;
    if (this.toDraw.length === 0) {
      return false;
    }
    madeConnection = false;
    this.draw();
    _results = [];
    while (!madeConnection && this.toDraw.length > 0) {
      i = _.random(this.toDraw.length - 1);
      vector = this.toDraw[i];
      cell = this.getCellByVector(vector);
      d = this.randomFreeDir(cell);
      if (d) {
        this.putOnBoard(vector, d.flag);
        this.putOnBoard(vector.add(d), d.opposite);
        madeConnection = true;
      }
      if ((this.neighbours[cell] & 15) === 0) {
        _results.push(this.toDraw.splice(i, 1));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Netwalk.prototype.randomize = function() {
    var cell, className, figure, i, j, vector;
    if (this.toRandomize.length === 0) {
      return false;
    }
    i = _.random(this.toRandomize.length - 1);
    vector = this.toRandomize[i];
    cell = this.getCellByVector(vector);
    figure = this.board[cell];
    j = _.random(3);
    while (j) {
      figure = this.turnFigure(figure);
      --j;
    }
    this.board[cell] = figure;
    className = this.getClassNameByMask(figure);
    this.style(cell, className);
    return this.toRandomize.splice(i, 1);
  };

  return Netwalk;

})();

newgame = function() {
  return new Netwalk;
};

$(document).ready(function() {
  newgame();
  return $('#new').click(function() {
    return newgame();
  });
});

