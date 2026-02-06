import ProjectsSection from '../components/workspace/ProjectSection';
import {CoursesSection} from "../components/workspace/CourseSection.tsx";

export default function WorkspacePage() {
    return (
        <main className="flex-1 bg-main overflow-hidden flex flex-col">
            <div className="flex-1 p-8 overflow-y-auto overflow-hidden">
                <div className="grid grid-cols-[75%,25%] gap-2 h-full">
                    <div className="grid grid-rows-[25%,25%,50%] gap-1 h-full">
                        {/* Col 1: Courses + Assignments */}
                        <div className="flex flex-col gap-4 overflow-hidden">
                            <CoursesSection/>
                        </div>
                        <div className="flex flex-col gap-4 overflow-hidden">
                            <div className="flex flex-col gap-4">
                                <ProjectsSection/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    );
}
