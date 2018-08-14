import { Exercise } from './excercise.model';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from 'angularfire2/firestore';

@Injectable()
export class TrainingService {
  exerciseChange = new Subject<Exercise>();
  exercisesChanged = new Subject<Exercise[]>();
  private availableExercises: Exercise[] = [];

  private runningExercise: Exercise;
  private exercises: Exercise[] = [];

  constructor(private db: AngularFirestore) {}

  fetchAvailableExervises() {
    this.db
      .collection('availableExercises')
      .snapshotChanges()
      .pipe(map(docArray => {
        return docArray.map((doc: DocumentChangeAction<Exercise>) => {
          return {
            id: doc.payload.doc.id,
            // name: doc.payload.doc.data().name,
            // duration: doc.payload.doc.data().duration,
            // calories: doc.payload.doc.data().calories
            ...doc.payload.doc.data()
          };
        });
      }))
      // .valueChanges(); // gets only the data of the document
      .subscribe((exercises) => {
        this.availableExercises = exercises;
        this.exercisesChanged.next([...this.availableExercises]);
      });
  }

  startExercise(selectedId: string) {
    this.runningExercise = this.availableExercises.find(ex => ex.id === selectedId);
    this.exerciseChange.next({ ...this.runningExercise});
  }

  completeExercise() {
    this.exercises.push({
      ...this.runningExercise,
      date: new Date(),
      state: 'completed'
    });
    this.runningExercise = null;
    this.exerciseChange.next(null);
  }

  cancelExercise(progress: number) {
    this.exercises.push({
      ...this.runningExercise,
      duration: this.runningExercise.duration * (progress / 100),
      calories: this.runningExercise.calories * (progress / 100),
      date: new Date(),
      state: 'cancelled'
    });
    this.runningExercise = null;
    this.exerciseChange.next(null);
  }

  getRunningExercise(): Exercise {
    return { ...this.runningExercise};
  }

  getCompletedOrCancelledExercises() {
    return this.exercises.slice();
  }

}
