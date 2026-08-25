import { Injectable } from '@angular/core';
import { ProjectPlan, ProjectPlanTask } from '../models/project-plan.models';
import { TaskDifficulty } from '../models/project.models';

export interface ProjectStarterTemplate {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  plan: ProjectPlan;
}

const step = (
  title: string,
  category: string,
  description: string,
  estimatedMinutes = 15,
  difficulty: TaskDifficulty = 'gentle'
): ProjectPlanTask => ({ title, category, description, estimatedMinutes, difficulty, notes: '' });

const TEMPLATES: readonly ProjectStarterTemplate[] = [
  {
    id: 'learn-something', badge: 'Learning', title: 'Learn Something New', icon: 'school-outline', accent: '#7458c8',
    description: 'Turn curiosity into a small, repeatable practice loop.',
    plan: {
      schemaVersion: 1, title: 'Learn Something New', description: 'Build confidence through short experiments and kind reflection.',
      tasks: [
        step('Choose one clear learning goal', 'Orientation', 'Write one sentence describing what you want to be able to do.', 10),
        step('Collect one beginner-friendly resource', 'Orientation', 'Choose a single course, guide, or book to begin with.', 15),
        step('Prepare a tiny practice space', 'Orientation', 'Gather only the tools needed for the first session.', 10),
        step('Complete the smallest first lesson', 'First practice', 'Stop after one useful idea or exercise.', 20),
        step('Repeat the exercise without looking', 'First practice', 'Try once from memory and notice where you pause.', 15, 'focused'),
        step('Schedule two short practice windows', 'Rhythm', 'Choose realistic times that already fit your week.', 10),
        step('Make one tiny thing with the skill', 'Rhythm', 'Use what you know in a playful, low-stakes mini project.', 30, 'focused'),
        step('Write what feels easier now', 'Reflection', 'Capture progress and choose the next small thing to learn.', 10)
      ]
    }
  },
  {
    id: 'tiny-app', badge: 'Build', title: 'Ship a Tiny App', icon: 'code-slash-outline', accent: '#16836a',
    description: 'Take a software idea from one useful screen to a shareable MVP.',
    plan: {
      schemaVersion: 1, title: 'Ship a Tiny App', description: 'Build one useful flow before adding more possibilities.',
      tasks: [
        step('Write the one-sentence promise', 'Define', 'Describe who the app helps and the single result it gives them.', 10),
        step('Sketch the main user flow', 'Define', 'Draw the shortest path from opening the app to getting value.', 15),
        step('Choose the smallest technical stack', 'Define', 'Use familiar tools and record the setup decision.', 10),
        step('Create the project shell', 'Build', 'Run the blank app locally and save the working baseline.', 20),
        step('Build the primary screen', 'Build', 'Implement the one screen that carries the core promise.', 30, 'focused'),
        step('Connect the main interaction', 'Build', 'Make the central user action work from start to finish.', 35, 'focused'),
        step('Add empty and error states', 'Polish', 'Help the interface stay understandable when data is missing.', 25, 'focused'),
        step('Test the full flow on a phone-sized screen', 'Polish', 'Complete the main journey and note only blocking issues.', 20),
        step('Share the smallest working version', 'Launch', 'Publish or send it to one friendly first user.', 25, 'stretch')
      ]
    }
  },
  {
    id: 'refresh-room', badge: 'Home', title: 'Refresh One Room', icon: 'home-outline', accent: '#b76843',
    description: 'Make one space calmer without turning it into a renovation.',
    plan: {
      schemaVersion: 1, title: 'Refresh One Room', description: 'Create a room that feels lighter, warmer, and easier to use.',
      tasks: [
        step('Choose how the room should feel', 'Imagine', 'Pick three words such as cosy, clear, bright, or restful.', 10),
        step('Take four honest photos', 'Imagine', 'Photograph each side so you can see the room with fresh eyes.', 10),
        step('Clear one visible surface', 'Reset', 'Remove everything, then return only useful or loved items.', 20),
        step('Make one donate-or-move box', 'Reset', 'Gather items that belong elsewhere without deciding everything now.', 20),
        step('Improve the main activity zone', 'Arrange', 'Adjust furniture or storage around what happens here most often.', 30, 'focused'),
        step('Add one warmer light source', 'Atmosphere', 'Use a lamp, bulb, or candle-like light to soften the room.', 15),
        step('Bring in one natural texture', 'Atmosphere', 'Try wood, linen, a plant, a basket, or another tactile detail.', 15),
        step('Live with it and note one final tweak', 'Settle', 'Use the room for a day before making the last small adjustment.', 10)
      ]
    }
  },
  {
    id: 'creative-piece', badge: 'Creative', title: 'Make a Creative Piece', icon: 'brush-outline', accent: '#cf547d',
    description: 'Move from a loose idea to something small and finished.',
    plan: {
      schemaVersion: 1, title: 'Make a Creative Piece', description: 'Protect the playful part of making while still reaching done.',
      tasks: [
        step('Capture the idea in one paragraph', 'Seed', 'Describe the feeling, image, or question you want to explore.', 10),
        step('Gather three references', 'Seed', 'Choose a small moodboard instead of an endless inspiration search.', 15),
        step('Set a friendly constraint', 'Shape', 'Limit the size, duration, palette, or tools to make starting easier.', 10),
        step('Create a rough first version', 'Make', 'Work quickly enough that perfection cannot take over.', 30, 'focused'),
        step('Choose the strongest part', 'Make', 'Identify what feels alive and let it guide the next pass.', 10),
        step('Complete one focused revision', 'Refine', 'Improve the most important area and leave minor details alone.', 30, 'focused'),
        step('Prepare a finished version', 'Finish', 'Export, frame, format, or package the piece cleanly.', 20),
        step('Share or place it somewhere visible', 'Finish', 'Let one person see it, or give it a real home.', 10, 'stretch')
      ]
    }
  },
  {
    id: 'small-adventure', badge: 'Travel', title: 'Plan a Small Adventure', icon: 'map-outline', accent: '#d88d2f',
    description: 'Shape a restorative trip without a wall of research tabs.',
    plan: {
      schemaVersion: 1, title: 'Plan a Small Adventure', description: 'Plan enough to feel safe, then leave room to discover.',
      tasks: [
        step('Choose the feeling you want from the trip', 'Dream', 'Name the priority: rest, nature, food, culture, or connection.', 10),
        step('Set the dates and comfortable budget', 'Frame', 'Write a realistic range before comparing options.', 15),
        step('Pick one destination', 'Frame', 'Choose from at most three candidates using your main priority.', 20, 'focused'),
        step('Book the travel and first night', 'Book', 'Secure the essentials that make the trip feel real.', 30, 'focused'),
        step('Save three meaningful places', 'Discover', 'Choose a few anchors rather than filling every hour.', 20),
        step('Plan the arrival path', 'Prepare', 'Note how you will get from arrival point to accommodation.', 15),
        step('Make a short packing list', 'Prepare', 'Start with weather, medication, documents, and comfort.', 15),
        step('Leave one day or afternoon unplanned', 'Prepare', 'Protect space for rest, wandering, or changing your mind.', 5)
      ]
    }
  },
  {
    id: 'gentle-routine', badge: 'Wellbeing', title: 'Build a Gentle Routine', icon: 'heart-outline', accent: '#548b61',
    description: 'Create a supportive rhythm without streaks or punishment.',
    plan: {
      schemaVersion: 1, title: 'Build a Gentle Routine', description: 'Make the helpful action easy to begin and easy to return to.',
      tasks: [
        step('Choose the smallest useful version', 'Design', 'Define what counts on a low-energy day.', 10),
        step('Attach it to an existing moment', 'Design', 'Place it after something that already happens naturally.', 10),
        step('Prepare the environment', 'Set up', 'Put the needed item where the routine will happen.', 10),
        step('Try the tiny version once', 'Practice', 'Treat this as an experiment, not a performance.', 10),
        step('Remove one point of friction', 'Practice', 'Change whatever made beginning awkward or slow.', 10),
        step('Repeat when it feels realistic', 'Rhythm', 'Return without making up for missed days.', 15),
        step('Review what genuinely helped', 'Reflect', 'Keep, simplify, or reshape the routine around real life.', 10)
      ]
    }
  }
];

@Injectable({ providedIn: 'root' })
export class ProjectTemplateService {
  readonly templates = TEMPLATES;

  planFor(id: string): ProjectPlan | undefined {
    const template = this.templates.find(item => item.id === id);
    return template ? structuredClone(template.plan) : undefined;
  }
}
