from time import sleep

class Agent:
    def __init__(self):
        self.arena = None
        self.matrix = None

    def get_data(self, data):
        self.arena = data['arena']
        self.matrix = data['player_matrix']
        self.process_data()

    def process_data(self):
        """calculate every possible move"""
        from app import visualise
        for rotation in range(4):
            if self.repetition_check(rotation):
                continue
            self.rotate()
            left_x, right_x = self.find_player_to_object_vector()
            x = -left_x
            while x+left_x >= 0 and x+right_x < len(self.arena[0]):
                visualise(x, self.matrix)
                sleep(0.1)
                x = x+1

    def find_player_to_object_vector(self):
        """checks if guess exceed arena"""
        left_x, right_x = 3, 0
        for y in range(len(self.matrix)):
            for x in range(len(self.matrix[y])):
                if self.matrix[y][x] != 0:
                    left_x = min(left_x, x)
                    right_x = max(right_x, x)
        return left_x, right_x

    def rotate(self):
        """rotate matrix"""
        transposed = [list(row) for row in zip(*self.matrix)]
        rotated = [row[::-1] for row in transposed]
        self.matrix = rotated

    def repetition_check(self, rotation):
        """get rid of repetitions when rotating"""
        max_val = max(max(row) for row in self.matrix)
        if max_val == 1 or max_val == 4 or max_val == 3:
            return False
        if max_val == 2:
            return rotation > 0
        if rotation < 2:
            return True


